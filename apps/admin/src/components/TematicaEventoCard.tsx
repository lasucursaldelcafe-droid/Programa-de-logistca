import {
  eventoTieneBriefing,
  formatEstadiaMinima,
  type Evento,
} from "@spe/shared";
import { Card } from "./ui";

interface TematicaEventoCardProps {
  evento: Evento | null | undefined;
  /** Título opcional sobre el nombre del evento */
  titulo?: string;
  className?: string;
}

export function TematicaEventoCard({
  evento,
  titulo = "Temática del evento",
  className = "",
}: TematicaEventoCardProps) {
  if (!evento) return null;

  const estadia = formatEstadiaMinima(evento.tiempoMinimoEstadiaMinutos);
  const tieneContenido = eventoTieneBriefing(evento) || estadia;

  if (!tieneContenido) return null;

  return (
    <Card className={`border-accent/25 bg-accent/5 ${className}`.trim()}>
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        {titulo}
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold text-white">
        {evento.nombre}
      </h3>

      {evento.temaLaboral?.trim() && (
        <div className="mt-4">
          <p className="text-xs font-medium text-neutral-400">Enfoque laboral</p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-200">
            {evento.temaLaboral.trim()}
          </p>
        </div>
      )}

      {evento.reglasOperativas?.trim() && (
        <div className="mt-4">
          <p className="text-xs font-medium text-neutral-400">Reglas en sitio</p>
          <ul className="mt-2 space-y-1.5 text-sm text-neutral-300">
            {evento.reglasOperativas
              .split(/\n+/)
              .map((linea) => linea.trim())
              .filter(Boolean)
              .map((linea) => (
                <li key={linea} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    aria-hidden
                  />
                  <span>{linea.replace(/^[-•]\s*/, "")}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {estadia && (
        <p className="mt-4 rounded-lg border border-border/80 bg-bg/60 px-3 py-2 text-xs text-neutral-400">
          {estadia}
        </p>
      )}
    </Card>
  );
}
