import { FormEvent, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { DEMO_MODE } from "../lib/mode";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
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

  if (!loading && user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Credenciales inválidas. Usa las cuentas de prueba del seed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-2xl font-bold">Admin Console</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Gestión de eventos, personal, turnos y supervisión en sitio
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
        <div className="mt-6 rounded-lg border border-border bg-bg p-3 text-xs text-neutral-400">
          <p className="font-semibold text-neutral-300">Cuentas Admin (seed)</p>
          <ul className="mt-2 space-y-1 font-mono">
            <li>admin@eventos.test / Admin123!</li>
            <li>supervisor@eventos.test / Super123!</li>
          </ul>
          <p className="mt-3 border-t border-border pt-3 text-neutral-500">
            Otras plataformas: Trabajador (5174) · Master (5175)
          </p>
          {deployLinks && (
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              <p>
                Admin:{" "}
                <a href={deployLinks.pagesUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                  {deployLinks.pagesUrl}
                </a>
              </p>
              <p>
                Trabajador:{" "}
                <a href={deployLinks.workerUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                  {deployLinks.workerUrl}
                </a>
              </p>
              <p>
                Master:{" "}
                <a href={deployLinks.masterUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                  {deployLinks.masterUrl}
                </a>
              </p>
            </div>
          )}
          <p className="mt-3">
            <Link to="/ayuda" className="text-accent hover:underline">
              Instrucciones de operación →
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
