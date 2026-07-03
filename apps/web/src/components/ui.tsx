import type { WorkerEstado, ShiftEstado } from "@spe/shared";

const estadoColor: Record<WorkerEstado, string> = {
  en_sitio: "bg-positive/15 text-positive",
  descanso: "bg-accent/15 text-accent",
  inactivo: "bg-neutral-600/30 text-neutral-400",
  sin_asignar: "bg-neutral-700/40 text-neutral-300",
};

const shiftColor: Record<ShiftEstado, string> = {
  pendiente: "bg-accent/15 text-accent",
  confirmado: "bg-positive/15 text-positive",
  rechazado: "bg-alert/15 text-alert",
  completado: "bg-neutral-600/30 text-neutral-400",
};

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: WorkerEstado | ShiftEstado | "neutral";
}) {
  const cls =
    tone in estadoColor
      ? estadoColor[tone as WorkerEstado]
      : tone in shiftColor
        ? shiftColor[tone as ShiftEstado]
        : "bg-neutral-800 text-neutral-300";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export function PerfilTag({ label }: { label: string }) {
  return (
    <span className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-300">
      {label}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 transition hover:border-accent/40 ${className}`}
    >
      {children}
    </div>
  );
}
