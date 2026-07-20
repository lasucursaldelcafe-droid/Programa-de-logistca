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
import { doc, getDoc } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirestoreDb,
  isFirebaseConfigured,
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

async function loadAppUser(firebaseUser: User): Promise<AppUser | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "users", firebaseUser.uid));
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
      const appUser = await loadAppUser(fbUser);
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
    const appUser = await loadAppUser(fbUser);
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
    const appUser = await loadAppUser(fbUser);
    if (!appUser) throw new Error("Usuario no registrado en el sistema");
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
