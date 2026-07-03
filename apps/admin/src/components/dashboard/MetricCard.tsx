import { Card } from "../ui";

const toneClass = {
  accent: "text-accent",
  positive: "text-positive",
  alert: "text-alert",
  neutral: "text-neutral-300",
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
    <Card>
      <div className={`font-mono text-3xl font-semibold ${toneClass[tone]}`}>
        {value}
      </div>
      <div className="text-sm text-neutral-400">{label}</div>
      {sublabel && <div className="mt-1 text-xs text-neutral-500">{sublabel}</div>}
    </Card>
  );
}
