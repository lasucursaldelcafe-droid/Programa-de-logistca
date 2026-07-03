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
  type AppUser,
  type UserRole,
} from "@spe/shared";
import { DEMO_MODE } from "../lib/mode";
import {
  clearDemoSession,
  demoLogin,
  loadDemoSession,
} from "../demo/store";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    if (DEMO_MODE) {
      setUser(loadDemoSession());
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
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUser = useCallback(async () => {
    if (DEMO_MODE) {
      setUser(loadDemoSession());
      return;
    }
    const fbUser = getFirebaseAuth().currentUser;
    if (!fbUser) {
      setUser(null);
      return;
    }
    const appUser = await loadAppUser(fbUser);
    setUser(appUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (DEMO_MODE) {
      const appUser = demoLogin(email, password);
      setUser(appUser);
      return;
    }
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const logout = useCallback(async () => {
    if (DEMO_MODE) {
      clearDemoSession();
      setUser(null);
      return;
    }
    await signOut(getFirebaseAuth());
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
