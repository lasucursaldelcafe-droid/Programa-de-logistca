import { useEffect } from "react";
import { Card, Badge } from "../components/ui";
import { usePosiciones } from "../hooks/useBusiness";
import { useWorkers } from "../hooks/useDataStore";
import { demoStore } from "../demo/store";
import { ESTADO_LABEL } from "@spe/shared";

export function SupervisionPage() {
  const posiciones = usePosiciones();
  const workers = useWorkers();

  useEffect(() => {
    const interval = setInterval(() => {
      demoStore.tickPosiciones();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const enSitio = workers.filter((w) => w.estado === "en_sitio").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Supervisión en vivo</h1>
        <p className="mt-1 text-neutral-400">
          Ubicación y estado del personal en tiempo real (simulación demo cada 5 s).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-bold text-positive">{enSitio}</div>
          <div className="text-sm text-neutral-400">En sitio ahora</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold">{posiciones.length}</div>
          <div className="text-sm text-neutral-400">Con GPS activo</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-positive" />
            <span className="text-sm text-neutral-400">Actualización automática</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">Mapa (demo)</h2>
          <div className="relative mt-4 aspect-video overflow-hidden rounded-lg border border-border bg-bg">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(38,38,38,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(38,38,38,0.5)_1px,transparent_1px)] bg-[size:24px_24px]" />
            {posiciones.map((p, i) => (
              <div
                key={p.workerId}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${20 + i * 25 + (Math.sin(Date.parse(p.actualizadoEn) / 10000) * 5)}%`,
                  top: `${30 + i * 15}%`,
                }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
                  {p.workerNombre.charAt(0)}
                </span>
                <span className="mt-1 rounded bg-surface/90 px-2 py-0.5 text-[10px] text-neutral-300">
                  {p.sitioNombre}
                </span>
              </div>
            ))}
            <div className="absolute bottom-2 left-2 rounded bg-surface/80 px-2 py-1 font-mono text-[10px] text-neutral-500">
              Bogotá · {posiciones[0]?.lat.toFixed(4)}, {posiciones[0]?.lng.toFixed(4)}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">Personal rastreado</h2>
          <ul className="mt-4 space-y-3">
            {posiciones.map((p) => (
              <li
                key={p.workerId}
                className="flex items-center justify-between rounded-lg border border-border bg-bg px-4 py-3"
              >
                <div>
                  <div className="font-medium">{p.workerNombre}</div>
                  <div className="text-xs text-neutral-500">{p.sitioNombre}</div>
                </div>
                <div className="text-right">
                  <Badge
                    label={ESTADO_LABEL[p.estado as keyof typeof ESTADO_LABEL] ?? p.estado}
                    tone={p.estado as "en_sitio" | "descanso"}
                  />
                  <div className="mt-1 font-mono text-[10px] text-neutral-500">
                    {new Date(p.actualizadoEn).toLocaleTimeString("es-CO")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
