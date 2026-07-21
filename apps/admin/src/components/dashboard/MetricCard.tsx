import { Card } from "../ui";

const toneClass = {
  accent: "text-accent",
  positive: "text-positive",
  alert: "text-alert",
  neutral: "text-neutral-300",
} as const;

const toneBg = {
  accent: "spe-metric-accent",
  positive: "spe-metric-positive",
  alert: "spe-metric-alert",
  neutral: "",
} as const;

export function MetricCard({
  value,
  label,
  sublabel,
  tone = "accent",
  onOpen,
}: {
  value: string | number;
  label: string;
  sublabel?: string;
  tone?: keyof typeof toneClass;
  /** Si se define, la tarjeta es un acceso directo (abre config rápida). */
  onOpen?: () => void;
}) {
  const body = (
    <>
      <div className={`font-mono text-2xl font-bold tracking-tight ${toneClass[tone]}`}>
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-neutral-300">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-neutral-500">{sublabel}</div>}
      {onOpen && (
        <span className="mt-2 inline-block text-[11px] font-medium text-accent/90">
          Abrir configuración →
        </span>
      )}
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`spe-glass spe-hover-lift relative w-full overflow-hidden rounded-2xl p-4 text-left transition hover:ring-1 hover:ring-accent/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${toneBg[tone]}`}
      >
        {body}
      </button>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${toneBg[tone]}`}>
      {body}
    </Card>
  );
}
