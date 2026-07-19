import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import {
  rutaHomePorRol,
  isFirebaseConfigured,
  isSheetsBackendConfigured,
  PLATFORM_SEED_ACCOUNTS,
  getRuntimeBackendLabel,
  resetToDemoMode,
  clearSheetsSession,
} from "@spe/shared";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { clearDemoSession } from "../demo/store";
import { clearDemoPersistedState } from "../demo/persist";
import { LoginAyudaPanel } from "../components/LoginAyudaPanel";
import { BiometricLoginButton } from "../components/BiometricLogin";
import { isBiometricAvailable, saveBiometricCredentials } from "../lib/biometricAuth";
import { sendPasswordReset } from "../hooks/useDataStore";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const deployLinks = useDeploymentLinks();
  const pagesBuildDemo = import.meta.env.VITE_DEMO_MODE === "true";
  const demoUi = pagesBuildDemo || isDemoMode();
  const [email, setEmail] = useState(demoUi ? "admin@eventos.test" : "");
  const [password, setPassword] = useState(demoUi ? "Admin123!" : "");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  useEffect(() => {
    void isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const firebaseReady =
    demoUi ||
    isDemoMode() ||
    isFirebaseConfigured() ||
    (isSheetsBackend() && isSheetsBackendConfigured());

  const backendLabel = getRuntimeBackendLabel({
    demoMode: import.meta.env.VITE_DEMO_MODE === "true",
    dataBackend: import.meta.env.VITE_DATA_BACKEND,
  });

  function restablecerDemo() {
    resetToDemoMode();
    clearSheetsSession();
    clearDemoSession();
    clearDemoPersistedState();
    window.location.href = `${import.meta.env.BASE_URL}login?spe_backend=demo`;
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
    <div className="spe-login-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/30">
            <span className="font-display text-xl font-bold text-accent">SPE</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Personal Eventos</h1>
          <p className="mt-1 text-sm text-neutral-400">
          Admin · Master · Trabajador — backend: <span className="text-accent">{backendLabel}</span>
        </p>
        </div>
      <Card className="w-full shadow-lg shadow-black/20">
        {demoUi && (
          <div className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-3 py-3 text-sm">
            <p className="font-semibold text-accent">
              {isDemoMode() ? "Modo demo — GitHub Pages" : "Cuentas demo disponibles"}
            </p>
            <p className="mt-1 text-neutral-300">
              {isDemoMode()
                ? "Los datos se guardan en este navegador. Para producción real:"
                : "Si el login falla, pulsa «Restablecer modo demo» abajo. Para backend real:"}{" "}
              <Link to="/configurar" className="text-accent underline">
                configurar con un toque
              </Link>{" "}
              o GitHub Secrets en el repo.
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-neutral-400">
              {PLATFORM_SEED_ACCOUNTS.map((a) => (
                <li key={a.email} className="flex flex-wrap items-center gap-2">
                  <span>{a.email} / {a.password}</span>
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
        {!firebaseReady && !isDemoMode() && (
          <div className="mt-4 rounded-lg border border-alert/40 bg-alert/10 px-3 py-3 text-sm text-alert">
            <p className="font-semibold">Backend no configurado</p>
            <p className="mt-1 text-neutral-300">
              Desde el celular:{" "}
              <Link to="/configurar" className="text-accent underline">
                Configurar con un toque
              </Link>{" "}
              (pega credenciales del correo). En PC:{" "}
              <code className="text-xs">npm run setup:sheets-auto</code>
            </p>
          </div>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
              required
              autoComplete="username"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <div className="space-y-2">
              <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
              {!isDemoMode() && (
                <p className="text-xs text-neutral-400">
                  Si usas <span className="font-mono">admin@eventos.test</span>, pulsa «Restablecer modo demo» abajo.
                </p>
              )}
            </div>
          )}
          {!isDemoMode() && (
            <button
              type="button"
              onClick={restablecerDemo}
              className="w-full rounded-lg border border-accent/40 py-2 text-sm text-accent"
            >
              Restablecer modo demo (admin@eventos.test / Admin123!)
            </button>
          )}
          {info && (
            <p className="rounded-lg bg-positive/10 px-3 py-2 text-sm text-positive">
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !firebaseReady}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black shadow-md shadow-accent/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting
              ? "Entrando…"
              : firebaseReady
                ? "Iniciar sesión"
                : pagesBuildDemo
                  ? "Restablece modo demo arriba para continuar"
                  : "Login deshabilitado — configurar Firebase"}
          </button>
          {pagesBuildDemo && isDemoMode() && (
            <button
              type="button"
              onClick={restablecerDemo}
              className="w-full rounded-lg border border-neutral-600 py-2 text-xs text-neutral-400"
            >
              Limpiar configuración guardada y recargar demo
            </button>
          )}
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
            <label className="flex items-center gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={enableBiometric}
                onChange={(e) => setEnableBiometric(e.target.checked)}
              />
              Activar ingreso con huella o rostro en este dispositivo
            </label>
          )}
          <button
            type="button"
            className="w-full text-sm text-neutral-400 hover:text-accent"
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
        <LoginAyudaPanel platform="admin" />
        <div className="mt-4 rounded-lg border border-border bg-bg p-3 text-xs text-neutral-400">
          <p className="font-semibold text-neutral-300">Acceso</p>
          <p className="mt-2 text-neutral-500">
            Usa el correo y contraseña que te asignó el administrador. Los trabajadores nuevos
            activan su cuenta con el código de invitación.
          </p>
          {deployLinks && (
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              <p>
                App web:{" "}
                <a href={deployLinks.pagesUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                  {deployLinks.pagesUrl}
                </a>
              </p>
            </div>
          )}
          <p className="mt-3">
            <Link to="/unirse" className="text-accent hover:underline">
              ¿Trabajador nuevo? Unirme con código de invitación →
            </Link>
          </p>
          <p className="mt-2">
            <Link to="/ayuda" className="text-accent hover:underline">
              Guía completa →
            </Link>
          </p>
        </div>
      </Card>
      </div>
    </div>
  );
}
