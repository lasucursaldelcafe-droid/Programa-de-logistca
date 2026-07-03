import type { CountBar } from "@spe/shared";

const barTone: Record<NonNullable<CountBar["tone"]>, string> = {
  accent: "bg-accent",
  positive: "bg-positive",
  alert: "bg-alert",
  neutral: "bg-neutral-600",
};

export function BarChart({
  title,
  bars,
  emptyLabel = "Sin datos",
}: {
  title: string;
  bars: CountBar[];
  emptyLabel?: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const hasData = bars.some((b) => b.value > 0);

  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-neutral-300">{title}</h3>
      {!hasData ? (
        <p className="mt-4 text-sm text-neutral-500">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {bars.map((bar) => (
            <div key={bar.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-neutral-400">{bar.label}</span>
                <span className="font-mono text-neutral-300">{bar.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full rounded-full transition-all ${barTone[bar.tone ?? "accent"]}`}
                  style={{ width: `${(bar.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
