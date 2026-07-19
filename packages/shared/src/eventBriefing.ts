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
