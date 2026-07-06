import { useState } from "react";
import {
  INVITATION_LABEL,
  ROLE_LABEL,
  buildInvitationEmailContent,
  buildInvitationMailtoUrl,
  puedeGestionarCuentas,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { buildInvitationUrls } from "../lib/urls";
import { DEMO_MODE } from "../lib/mode";
import { InstruccionesOperacion } from "../components/InstruccionesOperacion";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import {
  createInvitation,
  getInvitationByToken,
  revokeInvitation,
  useInvitations,
  useWorkers,
} from "../hooks/useDataStore";

export function CuentasPage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const invitations = useInvitations();
  const deployLinks = useDeploymentLinks();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [busyWorkerId, setBusyWorkerId] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<{ token: string; codigo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user || !puedeGestionarCuentas(user.role)) {
    return <p className="text-neutral-400">Sin permisos para gestionar cuentas.</p>;
  }

  const currentUser = user;

  const sinCuenta = workers.filter((w) => !w.cuentaCreada);
  const pendientes = invitations.filter((i) => i.estado === "pendiente");

  const appBase = () =>
    deployLinks?.pagesUrl ??
    import.meta.env.VITE_APP_URL ??
    (typeof window !== "undefined" ? `${window.location.origin}/` : "/");

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
      const { token, codigoAcceso } = await createInvitation({
        workerId: worker.id,
        workerNombre: worker.nombre,
        email: worker.email,
        role: worker.rolPlataforma ?? "trabajador",
        creadaPor: currentUser.uid,
        creadaPorNombre: currentUser.nombre,
      });

      const links = buildInvitationUrls(token, appBase());
      const invitation = await getInvitationByToken(token);

      if (invitation) {
        const mailto = buildInvitationMailtoUrl(invitation, links);
        window.location.href = mailto;
        setLastSent({ token, codigo: codigoAcceso });
      }
    } catch {
      setError("No se pudo crear la invitación.");
    } finally {
      setBusyWorkerId(null);
    }
  }

  async function copiarEnlace(token: string) {
    const links = buildInvitationUrls(token, appBase());
    const text = [
      `Web: ${links.webJoin}`,
      `Android (App): ${links.appJoin}`,
      `Activación web: ${links.webActivation}`,
      `Activación App: ${links.appActivation}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function copiarCorreo(inv: (typeof invitations)[0]) {
    const links = buildInvitationUrls(inv.token, appBase());
    const { subject, body } = buildInvitationEmailContent(inv, links);
    await navigator.clipboard.writeText(`Asunto: ${subject}\n\n${body}`);
    setCopiedToken(inv.token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function revocar(token: string) {
    await revokeInvitation(token);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Cuentas e invitaciones</h1>
        <p className="mt-1 text-neutral-400">
          El administrador envía invitaciones con el correo y rol de cada persona. Ellos crean su
          contraseña personal al activar la cuenta (código de un solo uso).
        </p>
      </div>

      {DEMO_MODE && (
        <Card className="border-accent/30 bg-accent/5">
          <p className="text-sm text-neutral-300">
            <strong className="text-accent">Modo demo:</strong> las invitaciones se sincronizan entre
            Admin y Trabajador web en el mismo dominio. En la App Android instale la misma versión
            demo o use Firebase en producción para sincronizar entre dispositivos.
          </p>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Cómo invitar personal</h2>
        <div className="mt-3">
          <InstruccionesOperacion platform="admin" compact />
        </div>
      </Card>

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}

      {lastSent && (
        <Card className="border-accent/30 bg-accent/5">
          <h2 className="font-semibold text-accent">Invitación creada</h2>
          <p className="mt-1 text-sm text-neutral-300">
            Se abrió tu cliente de correo. Si no se abrió, copia el código y el enlace manualmente.
          </p>
          <p className="mt-2 font-mono text-lg tracking-widest text-white">
            Código: {lastSent.codigo}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Este código solo funciona una vez y está ligado al correo del trabajador.
          </p>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Personal sin cuenta activa</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Genera invitación con el rol ya asignado en Personal. La persona usa su correo y elige
          contraseña al activar.
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
                  <div className="mt-1 text-xs text-neutral-500">
                    Rol: {ROLE_LABEL[w.rolPlataforma ?? "trabajador"]}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyWorkerId === w.id}
                  onClick={() => invitar(w.id)}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {busyWorkerId === w.id ? "Generando…" : "Enviar invitación por correo"}
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
                    Rol: {ROLE_LABEL[inv.role]}
                  </div>
                  {inv.estado === "pendiente" && inv.codigoAcceso && (
                    <div className="mt-1 font-mono text-sm text-accent">
                      Código: {inv.codigoAcceso}
                    </div>
                  )}
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
                        onClick={() => copiarCorreo(inv)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent"
                      >
                        Copiar correo
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
