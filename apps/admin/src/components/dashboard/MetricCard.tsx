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
}: {
  value: string | number;
  label: string;
  sublabel?: string;
  tone?: keyof typeof toneClass;
}) {
  return (
    <Card className={`relative overflow-hidden ${toneBg[tone]}`}>
      <div className={`font-mono text-2xl font-bold tracking-tight ${toneClass[tone]}`}>
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-neutral-300">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-neutral-500">{sublabel}</div>}
    </Card>
  );
}
