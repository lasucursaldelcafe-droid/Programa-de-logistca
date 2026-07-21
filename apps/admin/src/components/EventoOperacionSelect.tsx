import type { Evento } from "@spe/shared";

interface EventoOperacionSelectProps {
  events: Evento[];
  eventId: string;
  onChange: (eventId: string) => void;
  className?: string;
  label?: string;
  emptyMessage?: string;
}

/** Selector de evento (estado compartido vía useEventoOperacion en la página). */
export function EventoOperacionSelect({
  events,
  eventId,
  onChange,
  className = "",
  label = "Evento",
  emptyMessage = "No hay eventos creados.",
}: EventoOperacionSelectProps) {
  if (events.length === 0) {
    return <p className={`text-sm text-neutral-500 ${className}`}>{emptyMessage}</p>;
  }

  return (
    <label className={`text-sm ${className}`}>
      {label}
      <select
        value={eventId}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full max-w-full rounded-lg border border-border bg-bg px-3 py-2 sm:min-w-[220px] sm:w-auto"
      >
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
