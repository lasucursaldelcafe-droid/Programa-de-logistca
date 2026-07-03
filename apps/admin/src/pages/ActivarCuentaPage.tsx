import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import {
  activateAccountWithInvitation,
  getInvitationByToken,
} from "../hooks/useDataStore";
import type { Invitation } from "@spe/shared";

export function ActivarCuentaPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
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
      await activateAccountWithInvitation(token, password);
      await refreshUser();
      navigate("/completar-perfil", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Verificando invitación…
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="font-display text-xl font-bold">Invitación no encontrada</h1>
          <p className="mt-2 text-sm text-neutral-400">
            El enlace no es válido o ya fue eliminado.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
            Ir al inicio de sesión
          </Link>
        </Card>
      </div>
    );
  }

  if (invitation.estado !== "pendiente") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="font-display text-xl font-bold">Invitación no disponible</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Esta invitación ya fue {invitation.estado === "usada" ? "utilizada" : "revocada"}.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
            Ir al inicio de sesión
          </Link>
        </Card>
      </div>
    );
  }

  if (new Date(invitation.expiraEn) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="font-display text-xl font-bold">Invitación expirada</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Solicita al administrador una nueva invitación.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
            Ir al inicio de sesión
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-2xl font-bold">Activar cuenta</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Hola <span className="text-neutral-200">{invitation.workerNombre}</span>, define tu
          contraseña para acceder al sistema.
        </p>
        <p className="mt-2 font-mono text-xs text-neutral-500">{invitation.email}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Nueva contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
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
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
              minLength={8}
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Activando…" : "Activar cuenta"}
          </button>
        </form>
      </Card>
    </div>
  );
}
