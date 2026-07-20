import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { rutaHomePorRol } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { AuthShell, authButtonClass, authInputClass } from "../components/AuthShell";
import {
  activateAccountWithInvitation,
  getInvitationByToken,
} from "../hooks/useDataStore";
import { formatAuthError } from "../lib/authErrors";
import type { Invitation } from "@spe/shared";

export function ActivarCuentaPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [codigoAcceso, setCodigoAcceso] = useState(searchParams.get("codigo") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getInvitationByToken(token)
      .then(setInvitation)
      .finally(() => setLoading(false));
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!codigoAcceso.trim()) {
      setError("Ingresa el código de un solo uso que recibiste por correo.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const appUser = await activateAccountWithInvitation(token, password, codigoAcceso);
      await refreshUser();
      if (appUser.perfilCompleto) {
        navigate(rutaHomePorRol(appUser.role), { replace: true });
      } else {
        navigate("/completar-perfil", { replace: true });
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="spe-login-bg flex min-h-screen items-center justify-center text-neutral-400">
        Verificando invitación…
      </div>
    );
  }

  if (!invitation) {
    return (
      <AuthShell
        title="Invitación no encontrada"
        subtitle="El enlace no es válido o ya fue eliminado."
        footer={
          <>
            <Link to="/unirse" className="text-accent hover:underline">
              Activar con correo y código
            </Link>
            <span className="mx-2">·</span>
            <Link to="/login" className="text-accent hover:underline">
              Inicio de sesión
            </Link>
          </>
        }
      >
        <p className="text-center text-sm text-neutral-400">
          Solicita un nuevo enlace al administrador de tu empresa.
        </p>
      </AuthShell>
    );
  }

  if (invitation.estado !== "pendiente") {
    return (
      <AuthShell
        title="Invitación no disponible"
        subtitle={`Esta invitación ya fue ${invitation.estado === "usada" ? "utilizada" : "revocada"}. Cada código solo funciona una vez.`}
        footer={
          <Link to="/login" className="text-accent hover:underline">
            Ir al inicio de sesión
          </Link>
        }
      >
        <p className="text-center text-sm text-neutral-400">
          Si necesitas acceso, pide una nueva invitación al administrador.
        </p>
      </AuthShell>
    );
  }

  if (new Date(invitation.expiraEn) < new Date()) {
    return (
      <AuthShell
        title="Invitación expirada"
        subtitle="Solicita al administrador una nueva invitación."
        footer={
          <Link to="/login" className="text-accent hover:underline">
            Ir al inicio de sesión
          </Link>
        }
      >
        <p className="text-center text-sm text-neutral-400">
          Los códigos de invitación tienen fecha de vencimiento por seguridad.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Activar cuenta"
      subtitle={`Hola ${invitation.workerNombre}, crea tu contraseña personal para acceder con tu correo.`}
    >
      <p className="mb-4 font-mono text-xs text-neutral-500">{invitation.email}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Código de invitación (un solo uso)</span>
          <input
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
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Nueva contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            minLength={8}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Confirmar contraseña</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={authInputClass}
            minLength={8}
            required
          />
        </label>
        {error && (
          <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
        )}
        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? "Activando…" : "Activar cuenta"}
        </button>
      </form>
      <p className="mt-4 text-xs text-neutral-500">
        No compartas tu código. Quedará invalidado al activar la cuenta.
      </p>
    </AuthShell>
  );
}
