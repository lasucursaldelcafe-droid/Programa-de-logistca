import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell, authButtonClass, authInputClass } from "../components/AuthShell";
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
    <AuthShell
      title="Unirme a la empresa"
      subtitle="Ingresa el correo y el código de un solo uso que te envió el administrador."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Iniciar sesión
          </Link>
          <span className="mx-2">·</span>
          <Link to="/ayuda" className="text-accent hover:underline">
            Ver instrucciones
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm" htmlFor="unirse-email">
          <span className="mb-1 block text-neutral-300">Correo electrónico</span>
          <input
            id="unirse-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            required
          />
        </label>
        <label className="block text-sm" htmlFor="unirse-codigo">
          <span className="mb-1 block text-neutral-300">Código de invitación</span>
          <input
            id="unirse-codigo"
            name="codigoAcceso"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codigoAcceso}
            onChange={(e) => setCodigoAcceso(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${authInputClass} font-mono text-lg tracking-widest`}
            placeholder="000000"
            maxLength={6}
            required
          />
        </label>
        {error && (
          <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
        )}
        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? "Verificando…" : "Continuar"}
        </button>
      </form>
      <div className="mt-4 rounded-lg border border-border bg-bg p-3 text-xs text-neutral-400">
        <p className="font-semibold text-neutral-200">Pasos rápidos</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-neutral-400">
          <li>Ingresa correo y código del administrador</li>
          <li>Crea tu contraseña</li>
          <li>Completa tu perfil</li>
        </ol>
      </div>
    </AuthShell>
  );
}
