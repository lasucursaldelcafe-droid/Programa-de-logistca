import { Link } from "react-router-dom";
import type { ActivityItem } from "@spe/shared";
import { NOTIFICATION_TIPO_LABEL } from "@spe/shared";

export function ActivityFeed({
  items,
  showLink = true,
}: {
  items: ActivityItem[];
  showLink?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Sin actividad reciente.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border px-4 py-3 ${
            item.urgente
              ? "border-alert/40 bg-alert/5"
              : "border-border bg-bg/50"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{item.titulo}</span>
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
              {NOTIFICATION_TIPO_LABEL[item.tipo as keyof typeof NOTIFICATION_TIPO_LABEL] ??
                item.tipo}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">{item.mensaje}</p>
          <time className="mt-2 block text-xs text-neutral-500">
            {new Date(item.timestamp).toLocaleString("es-CO")}
          </time>
        </div>
      ))}
      {showLink && (
        <Link to="/notificaciones" className="text-sm text-accent hover:underline">
          Ver todas las notificaciones →
        </Link>
      )}
    </div>
  );
}
