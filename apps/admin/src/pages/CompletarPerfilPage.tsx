import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-lg">
        <h1 className="font-display text-2xl font-bold">Completa tu perfil</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Antes de continuar, confirma tus datos de contacto.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Nombre completo</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Teléfono</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
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
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Guardando…" : "Continuar al sistema"}
          </button>
        </form>
      </Card>
    </div>
  );
}
