import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthShell, authButtonClass, authInputClass } from "../components/AuthShell";
import {
  completeUserProfile,
  getWorkerById,
} from "../hooks/useDataStore";

export function CompletarPerfilPage() {
  const { user, refreshUser } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [telefono, setTelefono] = useState(user?.telefono ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.workerId) return;
    getWorkerById(user.workerId).then((worker) => {
      if (!worker) return;
      setNombre(worker.nombre);
      setTelefono(worker.telefono);
    });
  }, [user?.workerId]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.perfilCompleto === true) return <Navigate to="/" replace />;
  if (user.role !== "trabajador") return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!telefono.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await completeUserProfile({
        uid: user.uid,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });
      await refreshUser();
    } catch {
      setError("No se pudo guardar el perfil.");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      wide
      title="Completa tu perfil"
      subtitle="Antes de continuar, confirma tus datos de contacto."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Nombre completo</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={authInputClass}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Teléfono</span>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={authInputClass}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Correo</span>
          <input
            value={user.email}
            disabled
            className="w-full rounded-lg border border-border bg-neutral-900 px-3 py-2 text-neutral-500"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
        )}
        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? "Guardando…" : "Continuar al sistema"}
        </button>
      </form>
    </AuthShell>
  );
}
