import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthShell, authInputClass, authButtonClass } from "../components/AuthShell";
import {
  PLATFORM_ADMIN_EMAIL,
  rutaHomePorRol,
  isFirebaseConfigured,
  getRuntimeBackendLabel,
} from "@spe/shared";
import { BiometricLoginButton } from "../components/BiometricLogin";
import { isBiometricAvailable, saveBiometricCredentials } from "../lib/biometricAuth";
import { sendPasswordReset } from "../hooks/useDataStore";

const buildEnv = {
  demoMode: false,
  dataBackend: import.meta.env.VITE_DATA_BACKEND ?? "firebase",
};

function readLoginQueryParams(): { email: string; password: string; autoLogin: boolean } {
  if (typeof window === "undefined") {
    return { email: "", password: "", autoLogin: false };
  }
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.includes("?")
    ? window.location.hash.slice(window.location.hash.indexOf("?") + 1)
    : "";
  const hashParams = new URLSearchParams(hashQuery);

  const email = params.get("email") ?? hashParams.get("email") ?? "";
  const password = params.get("password") ?? hashParams.get("password") ?? "";
  const autoRaw = params.get("auto") ?? hashParams.get("auto") ?? "";
  const autoLogin = autoRaw === "1" || autoRaw.toLowerCase() === "true";

  return { email, password, autoLogin };
}

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const queryParams = readLoginQueryParams();
  const [email, setEmail] = useState(queryParams.email);
  const [password, setPassword] = useState(queryParams.password);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    void isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const backendReady = isFirebaseConfigured();
  const backendLabel = getRuntimeBackendLabel(buildEnv);

  useEffect(() => {
    if (loading || user || autoLoginAttempted || !queryParams.autoLogin) return;
    if (!email.trim() || !password || !backendReady) return;

    setAutoLoginAttempted(true);
    setSubmitting(true);
    setError(null);

    void login(email.trim(), password)
      .then((appUser) => navigate(rutaHomePorRol(appUser.role)))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Credenciales inválidas.");
      })
      .finally(() => setSubmitting(false));
  }, [
    autoLoginAttempted,
    backendReady,
    email,
    loading,
    login,
    navigate,
    password,
    queryParams.autoLogin,
    user,
  ]);

  if (!loading && user) {
    return <Navigate to={rutaHomePorRol(user.role)} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const appUser = await login(email, password);
      if (enableBiometric && biometricAvailable) {
        await saveBiometricCredentials(email, password);
      }
      navigate(rutaHomePorRol(appUser.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales inválidas.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Personal Eventos"
      subtitle={`Backend: ${backendLabel}`}
      footer={
        <>
          <Link to="/descargas" className="text-accent hover:underline">
            Descargas (Windows, Android, Linux, iOS)
          </Link>
          {" · "}
          <Link to="/unirse" className="text-accent hover:underline">
            Código de invitación
          </Link>
          {" · "}
          <Link to="/ayuda" className="text-accent hover:underline">
            Ayuda
          </Link>
        </>
      }
    >
      {!backendReady && (
        <div className="mb-3 rounded-lg border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
          Firebase no está configurado en este despliegue.{" "}
          <Link to="/configurar" className="underline">
            Revisar configuración
          </Link>
          {" o consulta "}
          <Link to="/pendientes" className="underline">
            pasos pendientes
          </Link>
          .
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            required
            autoComplete="username"
            placeholder={PLATFORM_ADMIN_EMAIL}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            required
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">{error}</p>
        )}
        {info && (
          <p className="rounded-lg bg-positive/10 px-3 py-2 text-xs text-positive">{info}</p>
        )}

        <button type="submit" disabled={submitting || !backendReady} className={authButtonClass}>
          {submitting ? "Entrando…" : "Iniciar sesión"}
        </button>

        <BiometricLoginButton
          onLogin={async (e, p) => {
            setEmail(e);
            setPassword(p);
            const appUser = await login(e, p);
            navigate(rutaHomePorRol(appUser.role));
          }}
          onError={setError}
        />

        {biometricAvailable && (
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <input
              type="checkbox"
              checked={enableBiometric}
              onChange={(e) => setEnableBiometric(e.target.checked)}
            />
            Huella o rostro en este dispositivo
          </label>
        )}

        <button
          type="button"
          className="w-full text-xs text-neutral-500 hover:text-accent"
          onClick={async () => {
            setError(null);
            setInfo(null);
            try {
              await sendPasswordReset(email);
              setInfo("Si el correo existe, recibirás un enlace de recuperación.");
            } catch {
              setError("No se pudo enviar el enlace de recuperación.");
            }
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </AuthShell>
  );
}
