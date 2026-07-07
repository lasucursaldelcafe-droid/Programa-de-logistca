import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import { rutaHomePorRol, isFirebaseConfigured } from "@spe/shared";
import { DEMO_MODE } from "../lib/mode";
import { LoginAyudaPanel } from "../components/LoginAyudaPanel";
import { BiometricLoginButton } from "../components/BiometricLogin";
import { isBiometricAvailable, saveBiometricCredentials } from "../lib/biometricAuth";
import { sendPasswordReset } from "../hooks/useDataStore";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const deployLinks = useDeploymentLinks();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  useEffect(() => {
    void isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const firebaseReady = DEMO_MODE || isFirebaseConfigured();

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-2xl font-bold">SPE — Personal Eventos</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Una sola app: entra con tu usuario y se abre tu panel (Admin, Master o Trabajador)
        </p>
        {!firebaseReady && (
          <div className="mt-4 rounded-lg border border-alert/40 bg-alert/10 px-3 py-3 text-sm text-alert">
            <p className="font-semibold">Backend no configurado</p>
            <p className="mt-1 text-neutral-300">
              Este sitio se publicó sin credenciales Firebase. El administrador del repositorio debe
              configurar los GitHub Secrets (<code className="text-xs">VITE_FIREBASE_*</code>) y volver
              a desplegar. Guía: <code className="text-xs">docs-source/PRODUCCION-FIREBASE.md</code>.
            </p>
            <p className="mt-2 text-neutral-400">
              Las cuentas <code className="text-xs">admin@eventos.test</code> solo funcionan en desarrollo
              local con emuladores (<code className="text-xs">npm run dev:full</code>), no en este enlace.
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
            <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-positive/10 px-3 py-2 text-sm text-positive">
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !firebaseReady}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Entrando…" : firebaseReady ? "Iniciar sesión" : "Login deshabilitado — configurar Firebase"}
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
  );
}
