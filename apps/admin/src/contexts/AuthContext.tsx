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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import {
  getFirebaseAuth,
  getFirestoreDb,
  isFirebaseConfigured,
  PLATFORM_ADMIN_EMAIL,
  type AppUser,
  type UserRole,
} from "@spe/shared";
import { formatAuthError } from "../lib/authErrors";
import { initPushNotifications } from "../lib/fcm";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
    role: "administrador",
    nombre: "La Sucursal del Café",
    perfilCompleto: true,
  };
}

async function ensurePlatformAdminProfile(firebaseUser: User): Promise<boolean> {
  const email = firebaseUser.email?.trim().toLowerCase();
  if (email !== PLATFORM_ADMIN_EMAIL.toLowerCase()) return false;
  try {
    await setDoc(doc(getFirestoreDb(), "users", firebaseUser.uid), {
      email: firebaseUser.email ?? PLATFORM_ADMIN_EMAIL,
      nombre: "La Sucursal del Café",
      role: "administrador",
      workerId: null,
      perfilCompleto: true,
    });
    return true;
  } catch {
    return false;
  }
}

async function resolveAppUser(firebaseUser: User): Promise<AppUser | null> {
  let appUser = await loadAppUser(firebaseUser);
  if (appUser) return appUser;

  if (firebaseUser.email?.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL.toLowerCase()) {
    const created = await ensurePlatformAdminProfile(firebaseUser);
    if (created) {
      appUser = await loadAppUser(firebaseUser);
      if (appUser) return appUser;
    }
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
    role: data.role as UserRole,
    workerId: data.workerId as string | undefined,
    nombre: (data.nombre as string) ?? firebaseUser.email ?? "Usuario",
    telefono: data.telefono as string | undefined,
    perfilCompleto: data.perfilCompleto as boolean | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    const fbUser = getFirebaseAuth().currentUser;
    if (!fbUser) {
      setUser(null);
      return;
    }
    const appUser = await resolveAppUser(fbUser);
    setUser(appUser);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AppUser> => {
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
          "). Ejecuta Bootstrap Firestore o crea el documento en Firebase Console.",
      );
    }
    setUser(appUser);
    return appUser;
  }, []);

  const logout = useCallback(async () => {
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
