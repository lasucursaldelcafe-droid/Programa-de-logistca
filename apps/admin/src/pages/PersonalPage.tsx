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
  updateWorkerEstado,
  useChangeLog,
  useWorkers,
} from "../hooks/useDataStore";
import { PageHeader } from "../components/nav/PageHeader";
import { DEMO_MODE } from "../lib/mode";

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
  const workers = useWorkers();
  const changeLog = useChangeLog();
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    perfiles: ["logistica"] as PerfilTrabajo[],
    rolPlataforma: "trabajador" as RolAsignablePorAdmin,
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const adminAsignaRoles = user ? puedeAsignarRoles(user.role) : false;

  if (!user || !puedeGestionarPersonal(user.role)) {
    return <p className="text-neutral-400">Sin permisos para gestionar personal.</p>;
  }

  const currentUser = user;

  async function crearTrabajador(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    await createWorker(
      {
        ...form,
        rolPlataforma: adminAsignaRoles ? form.rolPlataforma : "trabajador",
      },
      currentUser.nombre,
    );
    setForm({
      nombre: "",
      documento: "",
      telefono: "",
      email: "",
      perfiles: ["logistica"],
      rolPlataforma: "trabajador",
    });
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Personal"
        description="Registra personas y asigna roles. Los cambios se guardan automáticamente."
      />

      {DEMO_MODE && (
        <p className="rounded-lg border border-border bg-bg/60 px-3 py-2 text-xs text-neutral-500">
          Datos guardados en este navegador o app. Web, Android y Windows (con internet) comparten
          el mismo almacenamiento al usar la URL publicada.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
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

      {DEMO_MODE && changeLog.length > 0 && (
        <Card>
          <h2 className="font-display text-sm font-semibold text-neutral-300">Historial reciente</h2>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-neutral-500">
            {changeLog
              .filter((e) => e.action.startsWith("worker."))
              .slice(0, 15)
              .map((e) => (
                <li key={e.id}>
                  <span className="text-neutral-400">
                    {new Date(e.at).toLocaleString("es-CO")}
                  </span>
                  {" · "}
                  {e.action === "worker.create" && "Alta"}
                  {e.action === "worker.update" && "Actualización"}
                  {e.action === "worker.delete" && "Eliminación"}
                  {e.targetLabel ? `: ${e.targetLabel}` : ""}
                  {e.actorNombre ? ` (${e.actorNombre})` : ""}
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
