import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  ESTADO_LABEL,
  PERFILES_LABEL,
  getFirestoreDb,
  puedeGestionarPersonal,
  type PerfilTrabajo,
  type Worker,
  type WorkerEstado,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card, PerfilTag } from "../components/ui";

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
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    perfiles: ["logistica"] as PerfilTrabajo[],
  });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(getFirestoreDb(), "workers"), orderBy("nombre")),
      (snap) => setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker))),
    );
    return unsub;
  }, []);

  if (!user || !puedeGestionarPersonal(user.role)) {
    return <p className="text-neutral-400">Sin permisos para gestionar personal.</p>;
  }

  async function crearTrabajador(e: React.FormEvent) {
    e.preventDefault();
    await addDoc(collection(getFirestoreDb(), "workers"), {
      ...form,
      experienciaAnios: 0,
      eventosTrabajados: 0,
      rating: 0,
      estado: "sin_asignar" satisfies WorkerEstado,
      cuentaCreada: false,
      certificaciones: [],
      creadoEn: new Date().toISOString(),
    });
    setForm({ nombre: "", documento: "", telefono: "", email: "", perfiles: ["logistica"] });
  }

  async function cambiarEstado(id: string, estado: WorkerEstado) {
    await updateDoc(doc(getFirestoreDb(), "workers", id), { estado });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Personal</h1>
        <p className="mt-1 text-neutral-400">
          Perfiles, estados en vivo y clasificación por etiquetas.
        </p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Nuevo trabajador</h2>
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
