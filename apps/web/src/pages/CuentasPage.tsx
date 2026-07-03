import { useState } from "react";
import {
  INVITATION_LABEL,
  puedeGestionarCuentas,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { buildActivationUrl } from "../lib/urls";
import {
  createInvitation,
  revokeInvitation,
  useInvitations,
  useWorkers,
} from "../hooks/useDataStore";

export function CuentasPage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const invitations = useInvitations();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [busyWorkerId, setBusyWorkerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user || !puedeGestionarCuentas(user.role)) {
    return <p className="text-neutral-400">Sin permisos para gestionar cuentas.</p>;
  }

  const currentUser = user;

  const sinCuenta = workers.filter((w) => !w.cuentaCreada);
  const pendientes = invitations.filter((i) => i.estado === "pendiente");

  async function invitar(workerId: string) {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;

    const yaPendiente = pendientes.some(
      (i) => i.workerId === workerId && i.email === worker.email,
    );
    if (yaPendiente) {
      setError("Ya existe una invitación pendiente para este trabajador.");
      return;
    }

    setBusyWorkerId(workerId);
    setError(null);
    try {
      await createInvitation({
        workerId: worker.id,
        workerNombre: worker.nombre,
        email: worker.email,
        creadaPor: currentUser.uid,
        creadaPorNombre: currentUser.nombre,
      });
    } catch {
      setError("No se pudo crear la invitación.");
    } finally {
      setBusyWorkerId(null);
    }
  }

  async function copiarEnlace(token: string) {
    const url = buildActivationUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function revocar(token: string) {
    await revokeInvitation(token);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Cuentas</h1>
        <p className="mt-1 text-neutral-400">
          Invita trabajadores sin cuenta y gestiona enlaces de activación.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Trabajadores sin cuenta</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Genera un enlace de activación para que definan su contraseña.
        </p>
        <div className="mt-4 space-y-3">
          {sinCuenta.length === 0 ? (
            <p className="text-sm text-neutral-500">Todos los trabajadores tienen cuenta activa.</p>
          ) : (
            sinCuenta.map((w) => (
              <div
                key={w.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">{w.nombre}</div>
                  <div className="font-mono text-xs text-neutral-500">{w.email}</div>
                </div>
                <button
                  type="button"
                  disabled={busyWorkerId === w.id}
                  onClick={() => invitar(w.id)}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {busyWorkerId === w.id ? "Generando…" : "Generar invitación"}
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Invitaciones</h2>
        <div className="mt-4 space-y-3">
          {invitations.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay invitaciones registradas.</p>
          ) : (
            invitations.map((inv) => (
              <div
                key={inv.token}
                className="flex flex-col gap-3 rounded-lg border border-border bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">{inv.workerNombre}</div>
                  <div className="font-mono text-xs text-neutral-500">{inv.email}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Creada {new Date(inv.creadaEn).toLocaleString("es-CO")} · Expira{" "}
                    {new Date(inv.expiraEn).toLocaleDateString("es-CO")}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    label={INVITATION_LABEL[inv.estado]}
                    tone={inv.estado === "pendiente" ? "pendiente" : "neutral"}
                  />
                  {inv.estado === "pendiente" && (
                    <>
                      <button
                        type="button"
                        onClick={() => copiarEnlace(inv.token)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent"
                      >
                        {copiedToken === inv.token ? "¡Copiado!" : "Copiar enlace"}
                      </button>
                      <button
                        type="button"
                        onClick={() => revocar(inv.token)}
                        className="rounded-lg border border-alert/40 px-3 py-1.5 text-xs text-alert hover:bg-alert/10"
                      >
                        Revocar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
