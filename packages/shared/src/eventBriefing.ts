import type { Evento, Turno } from "./types";

/** Indica si el evento tiene temática o reglas para mostrar al trabajador. */
export function eventoTieneBriefing(evento: Evento | null | undefined): boolean {
  if (!evento) return false;
  return Boolean(evento.temaLaboral?.trim() || evento.reglasOperativas?.trim());
}

/** Texto de estadía mínima para mostrar en la UI. */
export function formatEstadiaMinima(minutos: number | undefined): string | null {
  if (minutos == null || minutos <= 0) return null;
  if (minutos < 60) return `${minutos} minutos mínimos en sitio antes de marcar salida`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (resto === 0) return `${horas} h mínimas en sitio antes de marcar salida`;
  return `${horas} h ${resto} min mínimos en sitio antes de marcar salida`;
}

/** Próximo turno confirmado del trabajador (por fecha de inicio). */
export function findProximoTurnoConfirmado(
  shifts: Turno[],
  workerId: string,
  now = Date.now(),
): Turno | null {
  const candidatos = shifts
    .filter(
      (s) =>
        s.workerId === workerId &&
        s.estado === "confirmado" &&
        new Date(s.fin).getTime() > now,
    )
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  return candidatos[0] ?? null;
}

/**
 * Turno confirmado vigente ahora (ventana inicio–fin).
 * Sirve para marcar “ya estoy aquí” sin escanear QR.
 */
export function findTurnoConfirmadoVigente(
  shifts: Turno[],
  workerId: string,
  now = Date.now(),
): Turno | null {
  return (
    shifts.find(
      (s) =>
        s.workerId === workerId &&
        s.estado === "confirmado" &&
        new Date(s.inicio).getTime() <= now &&
        new Date(s.fin).getTime() >= now,
    ) ?? null
  );
}

/** Marcador de asistencia iniciada por GPS (sin QR de sitio). */
export const GPS_CHECKIN_QR_ID = "gps";

/** Texto de consentimiento cuando la entrada es por GPS / “ya estoy aquí”. */
export const GPS_CHECKIN_CONSENT =
  "Recopilamos tu ubicación GPS solo durante la jornada activa para verificar que estás en el sitio asignado y activar tu asistencia.";
