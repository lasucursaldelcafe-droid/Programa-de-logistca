import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import {
  PLATFORM_ADMIN_EMAIL,
  PLATFORM_SEED_ACCOUNTS,
  rutaHomePorRol,
  isFirebaseConfigured,
  isSheetsBackendConfigured,
  getRuntimeBackendLabel,
  resetToDemoMode,
  clearSheetsSession,
} from "@spe/shared";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { clearDemoSession } from "../demo/store";
import { BiometricLoginButton } from "../components/BiometricLogin";
import { isBiometricAvailable, saveBiometricCredentials } from "../lib/biometricAuth";
import { sendPasswordReset } from "../hooks/useDataStore";

const buildEnv = {
  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
  dataBackend: import.meta.env.VITE_DATA_BACKEND,
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
  const demoUi = buildEnv.demoMode || isDemoMode();
  const [email, setEmail] = useState(
    queryParams.email || (demoUi ? "admin@eventos.test" : ""),
  );
  const [password, setPassword] = useState(
    queryParams.password || (demoUi ? "Admin123!" : ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    void isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const backendReady =
    demoUi ||
    isDemoMode() ||
    isFirebaseConfigured() ||
    (isSheetsBackend() && isSheetsBackendConfigured());

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

  function restablecerDemo() {
    resetToDemoMode();
    clearSheetsSession();
    clearDemoSession();
    window.location.reload();
  }

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
    <div className="spe-login-bg flex min-h-screen items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
            <span className="font-display text-lg font-bold text-accent">SPE</span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight">Personal Eventos</h1>
          <p className="mt-0.5 text-xs text-neutral-400">
            Backend: <span className="text-accent">{backendLabel}</span>
          </p>
        </div>

        <Card className="w-full p-4 shadow-lg shadow-black/20">
          {!backendReady && (
            <div className="mb-3 rounded-lg border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
              Backend no disponible.{" "}
              <Link to="/configurar" className="underline">
                Configurar
              </Link>
              {" o "}
              <button type="button" onClick={restablecerDemo} className="underline">
                restablecer modo demo
              </button>
            </div>
          )}

          {demoUi && (
            <div className="mb-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-3 text-sm">
              <p className="font-semibold text-accent">Cuentas demo</p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-neutral-300">
                {PLATFORM_SEED_ACCOUNTS.map((a) => (
                  <li key={a.email} className="flex flex-wrap items-center gap-2">
                    <span>
                      {a.email} / {a.password}
                    </span>
                    <button
                      type="button"
                      className="rounded border border-accent/30 px-2 py-0.5 text-[10px] text-accent hover:bg-accent/10"
                      onClick={() => {
                        setEmail(a.email);
                        setPassword(a.password);
                      }}
                    >
                      Usar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isSheetsBackend() && !demoUi && (
            <div className="mb-3 rounded-lg border border-border bg-bg/60 px-3 py-2 text-xs text-neutral-400">
              Producción: <span className="font-mono text-neutral-300">{PLATFORM_ADMIN_EMAIL}</span>
              {" · "}
              Demo Sheets: <span className="font-mono text-neutral-300">admin@eventos.test</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-400">Correo</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                required
                autoComplete="username"
                placeholder={demoUi ? "admin@eventos.test" : PLATFORM_ADMIN_EMAIL}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-400">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
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

            <button
              type="submit"
              disabled={submitting || !backendReady}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
            >
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

          {!demoUi && (
            <button
              type="button"
              onClick={restablecerDemo}
              className="mt-3 w-full rounded-lg border border-border py-2 text-xs text-neutral-400 hover:bg-neutral-800"
            >
              Restablecer modo demo (admin@eventos.test)
            </button>
          )}

          <p className="mt-3 border-t border-border pt-3 text-center text-xs text-neutral-500">
            <Link to="/unirse" className="text-accent hover:underline">
              Trabajador nuevo → código de invitación
            </Link>
            {" · "}
            <Link to="/ayuda" className="text-accent hover:underline">
              Ayuda
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
