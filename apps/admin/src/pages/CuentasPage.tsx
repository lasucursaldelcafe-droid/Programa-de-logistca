import { useState } from "react";
import {
  INVITATION_LABEL,
  ROLE_LABEL,
  buildInvitationEmailContent,
  puedeGestionarCuentas,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";
import { buildInvitationUrls } from "../lib/urls";
import { InstruccionesOperacion } from "../components/InstruccionesOperacion";
import { PermissionDenied } from "../components/FeedbackStates";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import {
  createInvitation,
  revokeInvitation,
  useInvitations,
  useWorkers,
  resetWorkerPassword,
  sendPasswordReset,
  setWorkerHabilitado,
  changeOwnPassword,
} from "../hooks/useDataStore";
import { isDemoMode } from "../lib/mode";
import { isSheetsBackend } from "../lib/backend";
import { PageHeader } from "../components/nav/PageHeader";

export function CuentasPage() {
  const { user } = useAuth();
  const workers = useWorkers();
  const invitations = useInvitations();
  const deployLinks = useDeploymentLinks();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [busyWorkerId, setBusyWorkerId] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<{ token: string; codigo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [ownNewPassword, setOwnNewPassword] = useState("");
  const [ownConfirmPassword, setOwnConfirmPassword] = useState("");
  const [ownPasswordMsg, setOwnPasswordMsg] = useState<string | null>(null);
  const [ownPasswordBusy, setOwnPasswordBusy] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);

  const puedeCambiarPropiaClave = !isSheetsBackend();

  if (!user || !puedeGestionarCuentas(user.role)) {
    return (
      <PermissionDenied
        role={user?.role}
        title="Sin permiso para invitaciones"
        description="Solo administradores pueden crear y gestionar cuentas de acceso."
      />
    );
  }

  const currentUser = user;

  const sinCuenta = workers.filter((w) => !w.cuentaCreada);
  const conCuenta = workers.filter((w) => w.cuentaCreada);
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

      setLastSent({ token, codigo: codigoAcceso });
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
    <div className="space-y-5">
      <PageHeader
        title="Cuentas"
        description="Invitaciones automáticas por correo (código, enlaces y pasos de activación)."
      />

      <Card>
        <h2 className="font-display text-lg font-semibold">Cómo invitar personal</h2>
        <div className="mt-3">
          <InstruccionesOperacion platform="admin" compact />
        </div>
      </Card>

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}

      {puedeCambiarPropiaClave && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Mi contraseña</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Cambia tu clave de acceso al panel. {isDemoMode() ? "Modo demo: solo local." : "Firebase producción."}
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (ownNewPassword !== ownConfirmPassword) {
                setOwnPasswordMsg("Las contraseñas nuevas no coinciden.");
                return;
              }
              setOwnPasswordBusy(true);
              setOwnPasswordMsg(null);
              try {
                await changeOwnPassword(currentPassword, ownNewPassword);
                setCurrentPassword("");
                setOwnNewPassword("");
                setOwnConfirmPassword("");
                setOwnPasswordMsg("Contraseña actualizada correctamente.");
              } catch (err) {
                setOwnPasswordMsg(
                  err instanceof Error ? err.message : "No se pudo cambiar la contraseña.",
                );
              } finally {
                setOwnPasswordBusy(false);
              }
            }}
          >
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-neutral-400">Contraseña actual</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
                required
                autoComplete="current-password"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-400">Nueva contraseña</span>
              <input
                type="password"
                value={ownNewPassword}
                onChange={(e) => setOwnNewPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-400">Confirmar nueva</span>
              <input
                type="password"
                value={ownConfirmPassword}
                onChange={(e) => setOwnConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={ownPasswordBusy}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {ownPasswordBusy ? "Guardando…" : "Cambiar mi contraseña"}
              </button>
              {ownPasswordMsg && (
                <p
                  className={`text-sm ${ownPasswordMsg.includes("actualizada") ? "text-accent" : "text-alert"}`}
                >
                  {ownPasswordMsg}
                </p>
              )}
            </div>
          </form>
        </Card>
      )}

      {lastSent && (
        <Card className="border-accent/30 bg-accent/5">
          <h2 className="font-semibold text-accent">Invitación creada</h2>
          <p className="mt-1 text-sm text-neutral-300">
            El correo se envía automáticamente con código, enlaces web/app y pasos para activar la
            cuenta. Si no llega en 1–2 minutos, revisa spam o usa «Copiar correo» abajo.
          </p>
          <p className="mt-2 font-mono text-lg tracking-widest text-white">
            Código: {lastSent.codigo}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Este código solo funciona una vez y está ligado al correo del trabajador.
          </p>
        </Card>
      )}

      {resetSentEmail && (
        <p className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
          Enlace de recuperación enviado a {resetSentEmail}. La persona puede crear una nueva
          contraseña e iniciar sesión.
        </p>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Personal sin cuenta activa</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Genera invitación con el rol ya asignado en Personal. Al registrar alguien nuevo en
          Personal, el correo se envía solo. Aquí puedes reenviar invitación manualmente.
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyWorkerId === w.id}
                    onClick={() => invitar(w.id)}
                    className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {busyWorkerId === w.id ? "Generando…" : "Enviar invitación por correo"}
                  </button>
                  {!isDemoMode() && (
                    <button
                      type="button"
                      disabled={busyWorkerId === w.id}
                      onClick={async () => {
                        setBusyWorkerId(w.id);
                        setError(null);
                        try {
                          await sendPasswordReset(w.email);
                          setResetSentEmail(w.email);
                          setTimeout(() => setResetSentEmail(null), 4000);
                        } catch {
                          setError(
                            `No se pudo enviar recuperación a ${w.email}. El correo puede no existir aún en Firebase.`,
                          );
                        } finally {
                          setBusyWorkerId(null);
                        }
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent"
                      title="Si el correo ya tiene cuenta pero la invitación falló, envía enlace para restablecer contraseña"
                    >
                      Recuperar contraseña
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Cuentas activas</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Restablece contraseña o inhabilita el acceso. La biometría del empleado se configura en su
          dispositivo tras iniciar sesión.
        </p>
        <div className="mt-4 space-y-3">
          {conCuenta.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay cuentas activas aún.</p>
          ) : (
            conCuenta.map((w) => (
              <div
                key={w.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">{w.nombre}</div>
                  <div className="font-mono text-xs text-neutral-500">{w.email}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {w.habilitado === false ? "Acceso inhabilitado" : "Acceso habilitado"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(w.email);
                      setNewPassword("");
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent"
                  >
                    Nueva contraseña
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkerHabilitado(w.id, w.habilitado === false, currentUser.nombre)
                    }
                    className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent"
                  >
                    {w.habilitado === false ? "Habilitar" : "Inhabilitar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {resetEmail && (
          <form
            className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (newPassword.length < 6) {
                setError("La contraseña debe tener al menos 6 caracteres.");
                return;
              }
              await resetWorkerPassword(resetEmail, newPassword);
              setResetEmail(null);
              setNewPassword("");
              setError(null);
            }}
          >
            <label className="text-sm">
              <span className="mb-1 block text-neutral-400">Nueva contraseña para {resetEmail}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-border bg-bg px-3 py-2"
                required
                minLength={6}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setResetEmail(null)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Cancelar
            </button>
          </form>
        )}
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
                  {inv.emailEnviadoEn && (
                    <div className="mt-1 text-xs text-positive">
                      Correo enviado {new Date(inv.emailEnviadoEn).toLocaleString("es-CO")}
                    </div>
                  )}
                  {inv.emailError && (
                    <div className="mt-1 text-xs text-alert">Correo: {inv.emailError}</div>
                  )}
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
