import { FormEvent, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { DEMO_MODE } from "../lib/mode";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import { rutaHomePorRol } from "@spe/shared";
import { LoginAyudaPanel } from "../components/LoginAyudaPanel";
import { sendPasswordReset } from "../hooks/useDataStore";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const deployLinks = useDeploymentLinks();
  const [email, setEmail] = useState("admin@eventos.test");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={rutaHomePorRol(user.role)} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const appUser = await login(email, password);
      navigate(rutaHomePorRol(appUser.role));
    } catch {
      setError("Credenciales inválidas. Usa las cuentas de prueba del seed.");
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
        {DEMO_MODE && (
          <p className="mt-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
            Modo demo en GitHub Pages — datos en memoria del navegador.
          </p>
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
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Entrando…" : "Iniciar sesión"}
          </button>
          <button
            type="button"
            className="w-full text-sm text-neutral-400 hover:text-accent"
            onClick={async () => {
              setError(null);
              setInfo(null);
              try {
                await sendPasswordReset(email);
                setInfo(
                  DEMO_MODE
                    ? "En modo demo no se envía correo; usa las contraseñas del seed."
                    : "Si el correo existe, recibirás un enlace de recuperación.",
                );
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
          <p className="font-semibold text-neutral-300">Cuenta de administración (única)</p>
          <ul className="mt-2 space-y-1 font-mono">
            <li>admin@eventos.test / Admin123!</li>
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            Master plataforma: master@eventos.test / Master123! — Supervisores y trabajadores se
            crean desde Personal + Cuentas con sus datos personales.
          </p>
          <p className="mt-2 text-neutral-500">
            Sin eventos ni personal precargados — empieza en Configuración.
          </p>
          {deployLinks && (
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              <p>
                App web unificada:{" "}
                <a href={deployLinks.pagesUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                  {deployLinks.pagesUrl}
                </a>
              </p>
              <p className="text-neutral-500">
                Windows y Android usan la misma app: al iniciar sesión se abre tu panel según tu rol.
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
