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
  updateWorkerEstado,
  useWorkers,
} from "../hooks/useDataStore";

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
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    perfiles: ["logistica"] as PerfilTrabajo[],
    rolPlataforma: "trabajador" as RolAsignablePorAdmin,
  });

  const adminAsignaRoles = user ? puedeAsignarRoles(user.role) : false;

  if (!user || !puedeGestionarPersonal(user.role)) {
    return <p className="text-neutral-400">Sin permisos para gestionar personal.</p>;
  }

  async function crearTrabajador(e: React.FormEvent) {
    e.preventDefault();
    await createWorker({
      ...form,
      rolPlataforma: adminAsignaRoles ? form.rolPlataforma : "trabajador",
    });
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
    await updateWorkerEstado(id, estado);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Personal</h1>
        <p className="mt-1 text-neutral-400">
          Registra personas con su nombre y correo. El administrador asigna el rol; las credenciales
          las crea cada persona al activar la invitación.
        </p>
      </div>

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
              <p className="mt-1 text-xs text-neutral-500">
                Solo el administrador define roles. La persona elige su contraseña al activar la
                invitación en Cuentas.
              </p>
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
