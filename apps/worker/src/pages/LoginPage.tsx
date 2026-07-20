import { FormEvent, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@core/contexts/AuthContext";
import { Card } from "@core/components/ui";
import { LoginAyudaPanel } from "@core/components/LoginAyudaPanel";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      setError("Credenciales inválidas.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-2xl font-bold">App Trabajador</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Escanea QR, marca entrada y reporta al supervisor
        </p>
        <div className="mt-3 rounded-lg border border-border bg-bg p-3 text-xs text-neutral-400">
          <p className="font-semibold text-neutral-200">Acceso de trabajador</p>
          <p className="mt-1">
            Usuario: tu correo · Contraseña inicial: tu documento / cédula (sin puntos ni espacios)
          </p>
          <Link to="/unirse" className="mt-2 inline-block text-accent hover:underline">
            ¿Invitación con código? Unirme aquí →
          </Link>
        </div>
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
            <span className="mb-1 block text-neutral-300">Documento / cédula (contraseña inicial)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {submitting ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
        <LoginAyudaPanel platform="worker" />
      </Card>
    </div>
  );
}
