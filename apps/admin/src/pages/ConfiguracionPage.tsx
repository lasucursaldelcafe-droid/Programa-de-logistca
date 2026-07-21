import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DEFAULT_PAYROLL_RATES,
  PERFILES_LABEL,
  WIZARD_STEPS,
  buildSetupSummary,
  formatCurrencyCOP,
  nextSetupPaso,
  puedeGestionarConfiguracion,
  setupStepIndex,
  validateEventoStep,
  validateOperacionesStep,
  validateSitioStep,
  type SetupPaso,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import {
  createEvent,
  createQrCode,
  createSite,
  deleteEvent,
  toUserFacingError,
  updateEvento,
  useEvents,
  useQrCodes,
  useSites,
} from "../hooks/useDataStore";
import {
  advanceSetupPaso,
  completeSetup,
  initSetupConfig,
  resetSetupForNewEvent,
  useSetupConfig,
} from "../hooks/useSetup";
import { upsertPayrollRate, usePayrollRates } from "../hooks/usePayroll";
import { SiteLocationPicker } from "../components/SiteLocationPicker";
import { PermissionDenied } from "../components/FeedbackStates";

const DEFAULT_DESCRIPCION =
  "Recopilamos tu ubicación GPS solo durante la jornada activa para verificar presencia en el sitio asignado.";

export function ConfiguracionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = useSetupConfig();
  const events = useEvents();
  const sites = useSites();
  const rates = usePayrollRates();
  const qrCodes = useQrCodes();

  const [paso, setPaso] = useState<SetupPaso>("evento");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [eventoForm, setEventoForm] = useState({
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [sitioForm, setSitioForm] = useState({
    nombre: "",
    direccion: "",
    lat: "4.6533",
    lng: "-74.0836",
    radioGeocerca: "80",
  });
  const [tarifasEdit, setTarifasEdit] = useState<Record<string, string>>({});
  const [operacionesForm, setOperacionesForm] = useState({
    temaLaboral: "",
    reglasOperativas: "",
    tiempoMinimoEstadiaMinutos: "30",
    supervisionActiva: true,
  });

  const eventoActivo = useMemo(() => {
    const id = config?.eventoId;
    return id ? events.find((e) => e.id === id) ?? null : events[0] ?? null;
  }, [config?.eventoId, events]);

  const sitiosEvento = useMemo(
    () => (eventoActivo ? sites.filter((s) => s.eventId === eventoActivo.id) : []),
    [sites, eventoActivo],
  );

  useEffect(() => {
    if (config?.pasoActual) setPaso(config.pasoActual);
  }, [config?.pasoActual]);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const rate of rates) {
      map[rate.perfil] = String(rate.tarifaPorHora);
    }
    setTarifasEdit(map);
  }, [rates]);

  useEffect(() => {
    if (!eventoActivo) return;
    setOperacionesForm({
      temaLaboral: eventoActivo.temaLaboral ?? "",
      reglasOperativas: eventoActivo.reglasOperativas ?? "",
      tiempoMinimoEstadiaMinutos: String(eventoActivo.tiempoMinimoEstadiaMinutos ?? 30),
      supervisionActiva: eventoActivo.supervisionActiva !== false,
    });
  }, [eventoActivo?.id, eventoActivo?.temaLaboral, eventoActivo?.reglasOperativas]);

  if (!user || !puedeGestionarConfiguracion(user.role)) {
    return (
      <PermissionDenied
        role={user?.role}
        title="Sin permiso de configuración"
        description="Solo administradores pueden usar el asistente de evento."
      />
    );
  }

  const currentUser = user;
  const stepIdx = setupStepIndex(paso);
  const resumen = buildSetupSummary({
    config: config ?? {
      id: "default",
      completado: false,
      pasoActual: paso,
      pasosCompletados: [],
      actualizadoEn: "",
      actualizadoPor: "",
    },
    evento: eventoActivo,
    sites,
    rates,
    qrCodes,
  });

  async function ensureConfig(): Promise<NonNullable<typeof config>> {
    if (config) return config;
    return initSetupConfig({ uid: currentUser.uid, nombre: currentUser.nombre });
  }

  async function guardarEvento(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validation = validateEventoStep(eventoForm);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    try {
      const cfg = await ensureConfig();
      const eventId = await createEvent(eventoForm);
      await advanceSetupPaso({
        paso: "evento",
        eventoId: eventId,
        actor: { uid: currentUser.uid, nombre: currentUser.nombre },
        current: cfg,
      });
      const next = nextSetupPaso("evento");
      if (next) setPaso(next);
      setMensaje(`Evento "${eventoForm.nombre}" creado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear evento");
    } finally {
      setBusy(false);
    }
  }

  async function eliminarEvento(eventId: string, nombre: string) {
    const ok = window.confirm(
      `¿Eliminar el evento "${nombre}"?\n\nSe borrarán sitios, turnos, QR, asistencias, chat y nómina de ese evento. Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setError(null);
    setMensaje(null);
    setBusy(true);
    try {
      await deleteEvent(eventId, currentUser.nombre);
      if (typeof sessionStorage !== "undefined") {
        const stored = sessionStorage.getItem("spe-evento-operacion");
        if (stored === eventId) sessionStorage.removeItem("spe-evento-operacion");
      }
      setMensaje(`Evento "${nombre}" eliminado.`);
      if (events.length <= 1) setPaso("evento");
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo eliminar el evento").message);
    } finally {
      setBusy(false);
    }
  }

  async function agregarSitio(e: React.FormEvent) {
    e.preventDefault();
    if (!eventoActivo) {
      setError("Primero crea un evento en el paso 1.");
      return;
    }
    setError(null);
    const validation = validateSitioStep(sitioForm);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    try {
      const nombre = sitioForm.nombre;
      await createSite({
        eventId: eventoActivo.id,
        nombre,
        direccion: sitioForm.direccion,
        lat: Number(sitioForm.lat),
        lng: Number(sitioForm.lng),
        radioGeocerca: Number(sitioForm.radioGeocerca),
      });
      setSitioForm((f) => ({ ...f, nombre: "", direccion: "" }));
      setMensaje(`Sitio "${nombre}" agregado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear sitio");
    } finally {
      setBusy(false);
    }
  }

  async function continuarSitios() {
    if (sitiosEvento.length === 0) {
      setError("Agrega al menos un sitio antes de continuar.");
      return;
    }
    setBusy(true);
    try {
      const cfg = await ensureConfig();
      await advanceSetupPaso({
        paso: "sitios",
        eventoId: eventoActivo?.id,
        actor: { uid: currentUser.uid, nombre: currentUser.nombre },
        current: cfg,
      });
      setPaso("tarifas");
      setError(null);
    } finally {
      setBusy(false);
    }
  }

  async function guardarTarifasYContinuar() {
    setBusy(true);
    setError(null);
    try {
      const toSave =
        rates.length > 0
          ? rates
          : DEFAULT_PAYROLL_RATES.map((r) => ({ ...r, id: `rate-${r.perfil}` }));

      if (rates.length === 0) {
        for (const rate of DEFAULT_PAYROLL_RATES) {
          await upsertPayrollRate({ ...rate, id: `rate-${rate.perfil}` });
        }
      } else {
        for (const rate of toSave) {
          const valor = tarifasEdit[rate.perfil];
          if (valor !== undefined) {
            await upsertPayrollRate({
              ...rate,
              tarifaPorHora: Number(valor),
            });
          }
        }
      }

      const cfg = await ensureConfig();
      await advanceSetupPaso({
        paso: "tarifas",
        eventoId: eventoActivo?.id,
        actor: { uid: currentUser.uid, nombre: currentUser.nombre },
        current: cfg,
      });
      setPaso("qr");
      setMensaje("Tarifas guardadas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar tarifas");
    } finally {
      setBusy(false);
    }
  }

  async function generarQrSitios() {
    if (!eventoActivo) {
      setError("No hay evento activo.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let creados = 0;
      for (const site of sitiosEvento) {
        const tieneQr = qrCodes.some(
          (q) => q.siteId === site.id && q.eventId === eventoActivo.id && q.activo,
        );
        if (tieneQr) continue;

        await createQrCode({
          eventId: eventoActivo.id,
          eventNombre: eventoActivo.nombre,
          siteId: site.id,
          siteNombre: site.nombre,
          modo: "por_jornada",
          ventanaInicio: eventoActivo.fechaInicio,
          ventanaFin: eventoActivo.fechaFin,
          radioGeocerca: site.radioGeocerca,
          descripcionDatos: DEFAULT_DESCRIPCION,
          creadoPor: currentUser.uid,
        });
        creados += 1;
      }

      const cfg = await ensureConfig();
      await advanceSetupPaso({
        paso: "qr",
        eventoId: eventoActivo.id,
        actor: { uid: currentUser.uid, nombre: currentUser.nombre },
        current: cfg,
      });
      setPaso("operaciones");
      setMensaje(
        creados > 0
          ? `Se generaron ${creados} código(s) QR.`
          : "Todos los sitios ya tenían QR activo.",
      );
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo generar el QR de los sitios.").message);
    } finally {
      setBusy(false);
    }
  }

  async function guardarOperaciones(e: React.FormEvent) {
    e.preventDefault();
    if (!eventoActivo) {
      setError("No hay evento activo.");
      return;
    }
    setError(null);
    const validation = validateOperacionesStep(operacionesForm);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    try {
      await updateEvento(eventoActivo.id, {
        temaLaboral: operacionesForm.temaLaboral.trim(),
        reglasOperativas: operacionesForm.reglasOperativas.trim(),
        tiempoMinimoEstadiaMinutos: Number(operacionesForm.tiempoMinimoEstadiaMinutos),
        supervisionActiva: operacionesForm.supervisionActiva,
      });
      const cfg = await ensureConfig();
      await advanceSetupPaso({
        paso: "operaciones",
        eventoId: eventoActivo.id,
        actor: { uid: currentUser.uid, nombre: currentUser.nombre },
        current: cfg,
      });
      setPaso("resumen");
      setMensaje("Reglas operativas y supervisión guardadas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar operaciones");
    } finally {
      setBusy(false);
    }
  }

  async function finalizarConfiguracion() {
    setBusy(true);
    try {
      await completeSetup({ uid: currentUser.uid, nombre: currentUser.nombre });
      setMensaje("Evento listo. Sigue con personal e invitaciones, luego asigna al equipo.");
      navigate("/operacion");
    } finally {
      setBusy(false);
    }
  }

  async function reiniciarAsistente() {
    setBusy(true);
    try {
      await resetSetupForNewEvent({ uid: currentUser.uid, nombre: currentUser.nombre });
      setPaso("evento");
      setEventoForm({ nombre: "", fechaInicio: "", fechaFin: "" });
      setMensaje("Asistente reiniciado para un nuevo evento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Paso 1 del flujo</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Crear evento</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400 sm:text-base">
          Asistente en 6 pasos: evento, sitios, tarifas, QR, operaciones (temática y reglas) y
          resumen. Después registra personal, envía invitaciones y asigna turnos en Operación.
        </p>
      </div>

      <WizardProgress current={paso} completados={config?.pasosCompletados ?? []} />

      {error && (
        <div className="rounded-lg border border-alert/40 bg-alert/10 px-4 py-3 text-sm text-alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="rounded-lg border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-positive">
          {mensaje}
        </div>
      )}

      {paso === "evento" && (
        <Card>
          <h2 className="font-display text-lg font-semibold">1. Crear evento</h2>
          <form onSubmit={guardarEvento} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Nombre del evento
              <input
                value={eventoForm.nombre}
                onChange={(e) => setEventoForm((f) => ({ ...f, nombre: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <label className="text-sm">
              Inicio
              <input
                type="datetime-local"
                value={eventoForm.fechaInicio}
                onChange={(e) => setEventoForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <label className="text-sm">
              Fin
              <input
                type="datetime-local"
                value={eventoForm.fechaFin}
                onChange={(e) => setEventoForm((f) => ({ ...f, fechaFin: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
              >
                {busy ? "Guardando…" : "Crear evento y continuar"}
              </button>
            </div>
          </form>
          {eventoActivo && (
            <p className="mt-4 text-sm text-neutral-500">
              Evento actual: <span className="text-neutral-300">{eventoActivo.nombre}</span>
            </p>
          )}
          {events.length > 0 && (
            <div className="mt-6 border-t border-border/60 pt-4">
              <h3 className="text-sm font-semibold text-neutral-300">Eventos registrados</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Puedes eliminar un evento completo (sitios, turnos, QR y datos asociados). No se puede
                si hay jornadas GPS abiertas.
              </p>
              <ul className="mt-3 space-y-2">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-200">
                        {ev.nombre}
                        {eventoActivo?.id === ev.id ? (
                          <span className="ml-2 text-[11px] text-accent">activo</span>
                        ) : null}
                      </p>
                      <p className="font-mono text-[11px] text-neutral-600">{ev.id}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void eliminarEvento(ev.id, ev.nombre)}
                      className="rounded-lg border border-alert/40 px-3 py-1.5 text-xs font-semibold text-alert hover:bg-alert/10 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {paso === "sitios" && (
        <Card>
          <h2 className="font-display text-lg font-semibold">2. Sitios y área de trabajo</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Evento: {eventoActivo?.nombre ?? "—"} · Indica dirección, ubica el punto en el mapa y define
            el radio del área de trabajo (geocerca GPS).
          </p>
          <form onSubmit={agregarSitio} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Nombre del sitio
              <input
                value={sitioForm.nombre}
                onChange={(e) => setSitioForm((f) => ({ ...f, nombre: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                required
              />
            </label>
            <SiteLocationPicker
              value={{
                direccion: sitioForm.direccion,
                lat: sitioForm.lat,
                lng: sitioForm.lng,
                radioGeocerca: sitioForm.radioGeocerca,
              }}
              onChange={(loc) => setSitioForm((f) => ({ ...f, ...loc }))}
            />
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/50"
              >
                Agregar sitio
              </button>
              <button
                type="button"
                onClick={continuarSitios}
                disabled={busy}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
              >
                Continuar →
              </button>
            </div>
          </form>
          {sitiosEvento.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {sitiosEvento.map((s) => (
                <li key={s.id} className="rounded border border-border px-3 py-2">
                  <div className="font-medium text-neutral-200">{s.nombre}</div>
                  {s.direccion && (
                    <div className="text-neutral-400">{s.direccion}</div>
                  )}
                  <div className="text-xs text-neutral-500">
                    {s.lat.toFixed(5)}, {s.lng.toFixed(5)} · área {s.radioGeocerca} m
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {paso === "tarifas" && (
        <Card>
          <h2 className="font-display text-lg font-semibold">3. Tarifas de nómina</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Confirma o ajusta el pago por hora de cada perfil.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-neutral-500">
                  <th className="py-2 pr-4">Perfil</th>
                  <th className="py-2">Tarifa/hora (COP)</th>
                </tr>
              </thead>
              <tbody>
                {(rates.length > 0 ? rates : DEFAULT_PAYROLL_RATES.map((r) => ({
                  id: `rate-${r.perfil}`,
                  ...r,
                }))).map((rate) => (
                  <tr key={rate.perfil} className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      {PERFILES_LABEL[rate.perfil] ?? rate.perfil}
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={tarifasEdit[rate.perfil] ?? String(rate.tarifaPorHora)}
                        onChange={(e) =>
                          setTarifasEdit((m) => ({ ...m, [rate.perfil]: e.target.value }))
                        }
                        className="w-32 rounded border border-border bg-bg px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={guardarTarifasYContinuar}
            disabled={busy}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
          >
            Guardar tarifas y continuar
          </button>
        </Card>
      )}

      {paso === "qr" && (
        <Card>
          <h2 className="font-display text-lg font-semibold">4. Códigos QR</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Genera QR por jornada para cada sitio sin código activo.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {sitiosEvento.map((s) => {
              const tieneQr = qrCodes.some(
                (q) =>
                  q.siteId === s.id &&
                  q.eventId === eventoActivo?.id &&
                  q.activo,
              );
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2"
                >
                  <span className="min-w-0 break-words">{s.nombre}</span>
                  <span className={`shrink-0 ${tieneQr ? "text-positive" : "text-accent"}`}>
                    {tieneQr ? "QR activo" : "Pendiente"}
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={generarQrSitios}
            disabled={busy || sitiosEvento.length === 0}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
          >
            Generar QR y continuar
          </button>
        </Card>
      )}

      {paso === "operaciones" && (
        <Card>
          <h2 className="font-display text-lg font-semibold">5. Operaciones y supervisión</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Define la temática laboral, reglas en sitio y checklist de personal antes de operar.
          </p>
          <form onSubmit={guardarOperaciones} className="mt-4 grid gap-3">
            <label className="text-sm">
              Temática laboral del evento
              <textarea
                value={operacionesForm.temaLaboral}
                onChange={(e) =>
                  setOperacionesForm((f) => ({ ...f, temaLaboral: e.target.value }))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                placeholder="Ej.: Montaje de stand, atención al público, uniforme corporativo…"
                required
              />
            </label>
            <label className="text-sm">
              Reglas operativas y supervisión
              <textarea
                value={operacionesForm.reglasOperativas}
                onChange={(e) =>
                  setOperacionesForm((f) => ({ ...f, reglasOperativas: e.target.value }))
                }
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
                placeholder="Horarios, funciones por sitio, reportes obligatorios, conducta en área…"
                required
              />
            </label>
            <label className="text-sm sm:max-w-xs">
              Tiempo mínimo de estadía (minutos)
              <input
                type="number"
                min={0}
                value={operacionesForm.tiempoMinimoEstadiaMinutos}
                onChange={(e) =>
                  setOperacionesForm((f) => ({
                    ...f,
                    tiempoMinimoEstadiaMinutos: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={operacionesForm.supervisionActiva}
                onChange={(e) =>
                  setOperacionesForm((f) => ({ ...f, supervisionActiva: e.target.checked }))
                }
              />
              Activar supervisión GPS (llegada, movimiento y geocerca)
            </label>
            <div className="rounded-lg border border-border bg-bg/50 px-4 py-3 text-sm text-neutral-400">
              <p className="font-medium text-neutral-300">Checklist antes de operar</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>
                  <Link to="/personal" className="text-accent hover:underline">
                    Registrar personal
                  </Link>{" "}
                  en el evento
                </li>
                <li>
                  <Link to="/cuentas" className="text-accent hover:underline">
                    Enviar invitaciones
                  </Link>{" "}
                  para que descarguen la app
                </li>
                <li>
                  <Link to="/turnos" className="text-accent hover:underline">
                    Asignar turnos
                  </Link>{" "}
                  por sitio y horario
                </li>
              </ul>
            </div>
            <button
              type="submit"
              disabled={busy || !eventoActivo}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
            >
              Guardar operaciones y continuar
            </button>
          </form>
        </Card>
      )}

      {paso === "resumen" && (
        <Card>
          <h2 className="font-display text-lg font-semibold">6. Resumen</h2>
          <ul className="mt-4 space-y-3">
            {resumen.map((item) => (
              <li
                key={item.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-4 py-3"
              >
                <span>{item.label}</span>
                <span className="text-sm text-neutral-400">{item.detalle}</span>
                <span className={item.ok ? "text-positive" : "text-accent"}>
                  {item.ok ? "✓" : "○"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={finalizarConfiguracion}
              disabled={busy || !eventoActivo || sitiosEvento.length === 0}
              className="rounded-lg bg-positive px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
            >
              Finalizar configuración
            </button>
            <button
              type="button"
              onClick={reiniciarAsistente}
              disabled={busy}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/50"
            >
              Configurar otro evento
            </button>
            {eventoActivo && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void eliminarEvento(eventoActivo.id, eventoActivo.nombre)}
                className="rounded-lg border border-alert/40 px-4 py-2 text-sm font-medium text-alert hover:bg-alert/10 disabled:opacity-50"
              >
                Eliminar este evento
              </button>
            )}
            <Link to="/personal" className="rounded-lg border border-border px-4 py-2 text-sm">
              Siguiente: Personal →
            </Link>
            <Link to="/operacion" className="rounded-lg border border-border px-4 py-2 text-sm">
              Asignar al evento →
            </Link>
            <Link to="/qr-sitios" className="rounded-lg border border-border px-4 py-2 text-sm">
              Ver QR sitios
            </Link>
          </div>
          {eventoActivo && (
            <p className="mt-4 text-xs text-neutral-500">
              Nómina estimada base: desde {formatCurrencyCOP(16_000)}/h según perfil.
            </p>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setPaso(s.id)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              s.id === paso
                ? "bg-accent/20 text-accent"
                : "border border-border text-neutral-400"
            }`}
          >
            {s.titulo}
          </button>
        ))}
      </div>
    </div>
  );
}

function WizardProgress({
  current,
  completados,
}: {
  current: SetupPaso;
  completados: SetupPaso[];
}) {
  const idx = setupStepIndex(current);
  return (
    <div className="flex flex-wrap gap-2">
      {WIZARD_STEPS.map((step, i) => {
        const done = completados.includes(step.id);
        const active = step.id === current;
        return (
          <div
            key={step.id}
            className={`min-w-[calc(50%-0.25rem)] flex-1 rounded-lg border px-2 py-2 text-center text-[11px] sm:min-w-[120px] sm:px-3 sm:text-xs ${
              active
                ? "border-accent bg-accent/10 text-accent"
                : done
                  ? "border-positive/40 text-positive"
                  : "border-border text-neutral-500"
            }`}
          >
            <div className="font-medium">
              {i + 1}. {step.titulo}
            </div>
            <div className="mt-0.5 hidden opacity-70 sm:block">{step.descripcion}</div>
          </div>
        );
      })}
      <div className="w-full text-center text-xs text-neutral-500">
        Paso {idx + 1} de {WIZARD_STEPS.length}
      </div>
    </div>
  );
}
