import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import {
  getFirebaseAuth,
  getFirestoreDb,
  isFirebaseConfigured,
  normalizeUserRole,
  PLATFORM_ADMIN_EMAIL,
  sheetsLogin,
  saveSheetsSession,
  clearSheetsSession,
  loadSheetsSession,
  type AppUser,
  type UserRole,
} from "@spe/shared";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { formatAuthError } from "../lib/authErrors";
import { initPushNotifications } from "../lib/fcm";
import {
  clearDemoSession,
  demoLogin,
  loadDemoSession,
} from "../demo/store";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type PendingInvitation = {
  email: string;
  role: UserRole;
  workerId?: string;
  workerNombre: string;
  customRoleId?: string;
};

function isFirestorePermissionDenied(error: unknown): boolean {
  if (error instanceof FirebaseError && error.code === "permission-denied") return true;
  if (error instanceof Error) {
    return (
      error.message.includes("Missing or insufficient permissions") ||
      error.message.includes("permission-denied")
    );
  }
  return false;
}

/** Acceso provisional cuando Auth OK pero faltan reglas Firestore desplegadas. */
function provisionalPlatformAdmin(firebaseUser: User): AppUser | null {
  const email = firebaseUser.email?.trim().toLowerCase();
  if (email !== PLATFORM_ADMIN_EMAIL.toLowerCase()) return null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? PLATFORM_ADMIN_EMAIL,
    role: "ceo",
    nombre: "CEO — Dirección general",
    perfilCompleto: true,
  };
}

function invitationFromData(
  normalizedEmail: string,
  data: Record<string, unknown>,
): PendingInvitation {
  return {
    email: normalizedEmail,
    role: normalizeUserRole(String(data.role ?? "trabajador")),
    workerId: typeof data.workerId === "string" ? data.workerId : undefined,
    workerNombre: String(data.workerNombre ?? normalizedEmail),
    customRoleId: typeof data.customRoleId === "string" ? data.customRoleId : undefined,
  };
}

async function findPendingInvitation(email: string): Promise<PendingInvitation | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const db = getFirestoreDb();

  // 1) Query indexada (si el índice está publicado)
  try {
    const snap = await getDocs(
      query(
        collection(db, "invitations"),
        where("email", "==", normalized),
        where("estado", "==", "pendiente"),
      ),
    );
    const data = snap.docs[0]?.data();
    if (data) return invitationFromData(normalized, data);
  } catch {
    // índice ausente / reglas — continuar con fallback
  }

  // 2) Fallback: invitations son de lectura pública; filtrar en cliente
  try {
    const all = await getDocs(collection(db, "invitations"));
    for (const d of all.docs) {
      const data = d.data();
      const invEmail = String(data.email ?? "")
        .trim()
        .toLowerCase();
      if (invEmail !== normalized) continue;
      if (String(data.estado ?? "") !== "pendiente") continue;
      return invitationFromData(normalized, data);
    }
  } catch {
    return null;
  }
  return null;
}

async function writeUserProfile(
  firebaseUser: User,
  profile: {
    email: string;
    nombre: string;
    role: UserRole;
    workerId?: string | null;
    customRoleId?: string;
    perfilCompleto?: boolean;
  },
): Promise<boolean> {
  try {
    await setDoc(
      doc(getFirestoreDb(), "users", firebaseUser.uid),
      {
        email: profile.email,
        nombre: profile.nombre,
        role: profile.role,
        workerId: profile.workerId ?? null,
        ...(profile.customRoleId ? { customRoleId: profile.customRoleId } : {}),
        perfilCompleto: profile.perfilCompleto ?? true,
        habilitado: true,
      },
      { merge: true },
    );
    return true;
  } catch {
    return false;
  }
}

async function ensurePlatformAdminProfile(firebaseUser: User): Promise<boolean> {
  const email = firebaseUser.email?.trim().toLowerCase();
  if (email !== PLATFORM_ADMIN_EMAIL.toLowerCase()) return false;
  // Intentar ceo (reglas nuevas); si falla, administrador (reglas intermedias).
  if (
    await writeUserProfile(firebaseUser, {
      email: firebaseUser.email ?? PLATFORM_ADMIN_EMAIL,
      nombre: "CEO — Dirección general",
      role: "ceo",
      workerId: null,
      perfilCompleto: true,
    })
  ) {
    return true;
  }
  return writeUserProfile(firebaseUser, {
    email: firebaseUser.email ?? PLATFORM_ADMIN_EMAIL,
    nombre: "CEO — Dirección general",
    role: "administrador",
    workerId: null,
    perfilCompleto: true,
  });
}

/**
 * Auth huérfano (cuenta Auth sin users/{uid}): crea el doc.
 * En reglas LIVE actuales solo self-create como trabajador está permitido;
 * si hay invitación de supervisor, intenta ese rol y hace fallback a trabajador.
 */
async function ensureMissingUserProfile(firebaseUser: User): Promise<boolean> {
  const email = firebaseUser.email?.trim().toLowerCase();
  if (!email) return false;

  if (email === PLATFORM_ADMIN_EMAIL.toLowerCase()) {
    return ensurePlatformAdminProfile(firebaseUser);
  }

  const invitation = await findPendingInvitation(email);
  const nombre =
    invitation?.workerNombre ||
    firebaseUser.displayName?.trim() ||
    email.split("@")[0] ||
    "Usuario";

  if (invitation) {
    const desiredRole = invitation.role;
    if (
      await writeUserProfile(firebaseUser, {
        email,
        nombre,
        role: desiredRole,
        workerId: invitation.workerId,
        customRoleId: invitation.customRoleId,
        perfilCompleto: desiredRole === "supervisor_sitio",
      })
    ) {
      return true;
    }
    // Reglas viejas: solo permiten self-create como trabajador
    if (desiredRole !== "trabajador") {
      return writeUserProfile(firebaseUser, {
        email,
        nombre,
        role: "trabajador",
        workerId: invitation.workerId,
        customRoleId: invitation.customRoleId,
        perfilCompleto: false,
      });
    }
    return false;
  }

  // Sin invitación: perfil mínimo para no dejar Auth huérfano
  return writeUserProfile(firebaseUser, {
    email,
    nombre,
    role: "trabajador",
    workerId: null,
    perfilCompleto: false,
  });
}

async function resolveAppUser(firebaseUser: User): Promise<AppUser | null> {
  let appUser = await loadAppUser(firebaseUser);
  if (appUser) return appUser;

  const created = await ensureMissingUserProfile(firebaseUser);
  if (created) {
    appUser = await loadAppUser(firebaseUser);
    if (appUser) return appUser;
  }

  if (firebaseUser.email?.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL.toLowerCase()) {
    return provisionalPlatformAdmin(firebaseUser);
  }

  return null;
}

async function loadAppUser(firebaseUser: User): Promise<AppUser | null> {
  let snap;
  try {
    snap = await getDoc(doc(getFirestoreDb(), "users", firebaseUser.uid));
  } catch (err) {
    const fallback = isFirestorePermissionDenied(err)
      ? provisionalPlatformAdmin(firebaseUser)
      : null;
    if (fallback) {
      console.warn("[SPE] Firestore sin reglas — sesión admin provisional");
      return fallback;
    }
    throw new Error(formatAuthError(err));
  }
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? data.email ?? "",
    role: normalizeUserRole(String(data.role ?? "trabajador")),
    workerId: data.workerId as string | undefined,
    customRoleId: data.customRoleId as string | undefined,
    nombre: (data.nombre as string) ?? firebaseUser.email ?? "Usuario",
    telefono: data.telefono as string | undefined,
    perfilCompleto: data.perfilCompleto as boolean | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setUser(loadDemoSession());
      setLoading(false);
      return;
    }

    if (isSheetsBackend()) {
      setUser(loadSheetsSession());
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(getFirebaseAuth(), async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const appUser = await resolveAppUser(fbUser);
      setUser(appUser);
      if (appUser) void initPushNotifications(appUser.uid);
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUser = useCallback(async () => {
    if (isDemoMode()) {
      setUser(loadDemoSession());
      return;
    }
    if (isSheetsBackend()) {
      setUser(loadSheetsSession());
      return;
    }
    const fbUser = getFirebaseAuth().currentUser;
    if (!fbUser) {
      setUser(null);
      return;
    }
    const appUser = await resolveAppUser(fbUser);
    setUser(appUser);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AppUser> => {
    if (isDemoMode()) {
      try {
        const appUser = demoLogin(email, password);
        setUser(appUser);
        return appUser;
      } catch (err) {
        throw err instanceof Error ? err : new Error("Credenciales inválidas");
      }
    }
    if (isSheetsBackend()) {
      try {
        const result = await sheetsLogin(email, password);
        const appUser: AppUser = {
          uid: result.uid,
          email: result.email,
          nombre: result.nombre,
          role: result.role as UserRole,
          workerId: result.workerId ?? undefined,
          customRoleId: result.customRoleId ?? undefined,
          perfilCompleto: result.perfilCompleto ?? true,
        };
        saveSheetsSession(appUser);
        setUser(appUser);
        return appUser;
      } catch (err) {
        throw err instanceof Error ? err : new Error("Credenciales inválidas (Sheets)");
      }
    }
    if (!isFirebaseConfigured()) {
      throw new Error(
        "Firebase no está configurado en este despliegue. El administrador debe añadir las credenciales en GitHub Secrets (ver PRODUCCION-FIREBASE.md).",
      );
    }
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
    const fbUser = getFirebaseAuth().currentUser;
    if (!fbUser) throw new Error("No se pudo iniciar sesión");
    void initPushNotifications(fbUser.uid);
    let appUser: AppUser | null;
    try {
      appUser = await resolveAppUser(fbUser);
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
    if (!appUser) {
      throw new Error(
        "Usuario autenticado pero sin perfil en Firestore (users/" +
          fbUser.uid +
          "). En Firebase Console → Firestore → users → Add document con ID " +
          fbUser.uid +
          " (email, nombre, role, habilitado=true). O publica firestore.rules y vuelve a entrar.",
      );
    }
    setUser(appUser);
    return appUser;
  }, []);

  const logout = useCallback(async () => {
    if (isDemoMode()) {
      clearDemoSession();
      setUser(null);
      return;
    }
    if (isSheetsBackend()) {
      clearSheetsSession();
      setUser(null);
      return;
    }
    await signOut(getFirebaseAuth());
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
