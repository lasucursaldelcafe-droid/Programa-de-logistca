import { useState } from "react";
import {
  ESTADO_LABEL,
  PERFILES_LABEL,
  ROLE_LABEL,
  ROLES_ASIGNABLES_ADMIN,
  puedeAsignarRoles,
  puedeGestionarPersonal,
  type PerfilTrabajo,
  type RolAsignablePorAdmin,
  type WorkerEstado,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card, PerfilTag } from "../components/ui";
import {
  createWorker,
  deleteWorker,
  setWorkerHabilitado,
  updateWorkerEstado,
  useWorkersState,
} from "../hooks/useDataStore";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied, DataLoadingSkeleton } from "../components/FeedbackStates";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";

const PERFILES: PerfilTrabajo[] = [
  "logistica",
  "recreacion",
  "supervisor",
  "montaje",
  "chef",
  "seguridad",
  "anfitrion",
];

export function PersonalPage() {
  const { user } = useAuth();
  const { workers, loading } = useWorkersState();
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    perfiles: ["logistica"] as PerfilTrabajo[],
    rolPlataforma: "trabajador" as RolAsignablePorAdmin,
  });
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const adminAsignaRoles = user ? puedeAsignarRoles(user.role) : false;

  if (!user || !puedeGestionarPersonal(user.role)) {
    return (
      <PermissionDenied
        role={user?.role}
        title="Sin permiso para personal"
        description="Solo administradores y supervisores pueden registrar y gestionar trabajadores."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Personal" description="Cargando…" />
        <DataLoadingSkeleton rows={5} />
      </div>
    );
  }

  const currentUser = user;

  async function crearTrabajador(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      const nombreGuardado = form.nombre;
      await createWorker(
        {
          ...form,
          rolPlataforma: adminAsignaRoles ? form.rolPlataforma : "trabajador",
        },
        {
          actorNombre: currentUser.nombre,
          creadaPor: currentUser.uid,
          creadaPorNombre: currentUser.nombre,
          enviarInvitacion: !isDemoMode() && !isSheetsBackend(),
        },
      );
      setForm({
        nombre: "",
        documento: "",
        telefono: "",
        email: "",
        perfiles: ["logistica"],
        rolPlataforma: "trabajador",
      });
      if (!isDemoMode() && !isSheetsBackend()) {
        setMensaje(
          `${nombreGuardado} registrado/a. Se envió invitación automática al correo con código y enlace de activación.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la persona.");
    }
  }

  async function cambiarEstado(id: string, estado: WorkerEstado) {
    await updateWorkerEstado(id, estado, currentUser.nombre);
  }

  async function eliminar(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteWorker(id, currentUser.nombre);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleHabilitado(id: string, habilitado: boolean) {
    await setWorkerHabilitado(id, habilitado, currentUser.nombre);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Personal"
        description="Registra personas y asigna roles. En producción se envía invitación automática al correo."
      />

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}
      {mensaje && (
        <p className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
          {mensaje}
        </p>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Nueva persona</h2>
        <form onSubmit={crearTrabajador} className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["nombre", "documento", "telefono", "email"] as const).map((field) => (
            <label key={field} className="text-sm capitalize">
              <span className="mb-1 block text-neutral-300">{field}</span>
              <input
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                required={field !== "telefono"}
              />
            </label>
          ))}
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-neutral-300">Perfiles</span>
            <select
              multiple
              value={form.perfiles}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  perfiles: Array.from(e.target.selectedOptions, (o) => o.value as PerfilTrabajo),
                }))
              }
              className="h-28 w-full rounded-lg border border-border bg-bg px-3 py-2"
            >
              {PERFILES.map((p) => (
                <option key={p} value={p}>
                  {PERFILES_LABEL[p] ?? p}
                </option>
              ))}
            </select>
          </label>
          {adminAsignaRoles && (
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-neutral-300">Rol en la plataforma</span>
              <select
                value={form.rolPlataforma}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rolPlataforma: e.target.value as RolAsignablePorAdmin,
                  }))
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                {ROLES_ASIGNABLES_ADMIN.map((rol) => (
                  <option key={rol} value={rol}>
                    {ROLE_LABEL[rol]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
            >
              Registrar trabajador
            </button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {workers.length === 0 && (
          <p className="text-sm text-neutral-500">No hay personal registrado.</p>
        )}
        {workers.map((w) => (
          <Card key={w.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-display text-lg font-semibold">{w.nombre}</div>
              <div className="mt-1 font-mono text-xs text-neutral-500">
                {w.documento} · {w.email}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Rol: {ROLE_LABEL[w.rolPlataforma ?? "trabajador"]}
                {w.cuentaCreada ? " · Cuenta activa" : " · Sin activar"}
                {w.habilitado === false ? " · Inhabilitado" : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.perfiles.map((p) => (
                  <PerfilTag key={p} label={PERFILES_LABEL[p] ?? p} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={ESTADO_LABEL[w.estado]} tone={w.estado} />
              <select
                value={w.estado}
                onChange={(e) => cambiarEstado(w.id, e.target.value as WorkerEstado)}
                className="rounded-lg border border-border bg-bg px-2 py-1 text-xs"
              >
                {Object.entries(ESTADO_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => toggleHabilitado(w.id, w.habilitado === false)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  w.habilitado === false
                    ? "border-positive/40 text-positive hover:bg-positive/10"
                    : "border-neutral-600 text-neutral-400 hover:border-alert/40 hover:text-alert"
                }`}
              >
                {w.habilitado === false ? "Habilitar acceso" : "Inhabilitar acceso"}
              </button>
              {confirmDeleteId === w.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={deletingId === w.id}
                    onClick={() => eliminar(w.id)}
                    className="rounded-lg bg-alert px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {deletingId === w.id ? "Eliminando…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(w.id)}
                  className="rounded-lg border border-alert/40 px-3 py-1.5 text-xs text-alert hover:bg-alert/10"
                >
                  Eliminar
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
