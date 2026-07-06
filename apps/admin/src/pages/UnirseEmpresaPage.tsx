import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui";
import { findInvitationByEmailAndCode } from "../hooks/useDataStore";

export function UnirseEmpresaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [codigoAcceso, setCodigoAcceso] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const invitation = await findInvitationByEmailAndCode(email, codigoAcceso);
      if (!invitation) {
        setError("Correo o código incorrectos, o la invitación ya fue usada.");
        return;
      }
      if (new Date(invitation.expiraEn) < new Date()) {
        setError("La invitación expiró. Pide una nueva al administrador.");
        return;
      }
      navigate(`/activar/${invitation.token}?codigo=${invitation.codigoAcceso}`, {
        replace: true,
      });
    } catch {
      setError("No se pudo verificar la invitación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-2xl font-bold">Unirme a la empresa</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Ingresa el correo y el código de un solo uso que te envió el administrador.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Código de invitación</span>
            <input
              type="text"
              inputMode="numeric"
              value={codigoAcceso}
              onChange={(e) => setCodigoAcceso(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-lg tracking-widest outline-none focus:border-accent"
              placeholder="000000"
              maxLength={6}
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
            {submitting ? "Verificando…" : "Continuar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Iniciar sesión
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/ayuda" className="text-accent hover:underline">
            Ver instrucciones de operación →
          </Link>
        </p>
        <div className="mt-4 rounded-lg border border-border bg-bg p-3 text-xs text-neutral-400">
          <p className="font-semibold text-neutral-200">Pasos rápidos</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-neutral-400">
            <li>Ingresa correo y código del administrador</li>
            <li>Crea tu contraseña</li>
            <li>Completa tu perfil</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
