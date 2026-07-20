import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getSetupGuideSteps,
  getSetupGuideStepsCompleted,
  type SetupGuideStep,
} from "@spe/shared";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import { useProductionSetupStatusLive } from "../hooks/useProductionSetupStatus";
import { PageHeader } from "../components/nav/PageHeader";
import { Card } from "../components/ui";

const priorityStyle = {
  p0: "bg-alert/15 text-alert",
  p1: "bg-accent/15 text-accent",
  p2: "bg-neutral-700/50 text-neutral-400",
} as const;

function GuideBlock({ step, done = false }: { step: SetupGuideStep; done?: boolean }) {
  return (
    <Card className={`space-y-4 ${done ? "opacity-75" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {done ? (
            <span className="rounded-full bg-positive/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-positive">
              Completado
            </span>
          ) : (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyle[step.priority]}`}
            >
              {step.priority === "p0" ? "Urgente" : step.priority === "p1" ? "Importante" : "Próximo"}
            </span>
          )}
          <h2 className="mt-2 font-display text-lg font-semibold">{step.title}</h2>
          <p className="mt-1 text-sm text-neutral-400">{step.summary}</p>
        </div>
      </div>

      {!done && (
        <>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-300">
            {step.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          {step.credentials && step.credentials.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-bg/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Credenciales / valores a pegar
              </p>
              <dl className="space-y-2">
                {step.credentials.map((row) => (
                  <div key={row.label} className="grid gap-1 sm:grid-cols-[minmax(0,11rem)_1fr]">
                    <dt className="font-mono text-xs text-accent">{row.label}</dt>
                    <dd className="font-mono text-xs text-neutral-200">
                      {row.value}
                      {row.note && (
                        <span className="mt-0.5 block text-[10px] text-neutral-500">{row.note}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {step.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                className="rounded-lg bg-accent/15 px-3 py-2 text-xs font-semibold text-accent ring-1 ring-accent/25 transition hover:bg-accent/25"
              >
                {link.label} →
              </a>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-neutral-500">
        <span className="text-positive">✓ Listo cuando:</span> {step.doneWhen}
      </p>
    </Card>
  );
}

export function PendientesPage() {
  const deployLinks = useDeploymentLinks();
  const setupStatus = useProductionSetupStatusLive();

  const deployBase = useMemo(
    () =>
      deployLinks
        ? {
            pagesUrl: deployLinks.pagesUrl,
            repoUrl: deployLinks.repoUrl,
            actionsUrl: deployLinks.actionsUrl,
            owner: deployLinks.owner,
            repo: deployLinks.repo,
          }
        : undefined,
    [deployLinks],
  );

  const pendingSteps = useMemo(
    () => getSetupGuideSteps(deployBase, setupStatus),
    [deployBase, setupStatus],
  );

  const completedSteps = useMemo(
    () => getSetupGuideStepsCompleted(deployBase, setupStatus),
    [deployBase, setupStatus],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Configuración pendiente"
        description="Solo lo que falta por hacer — lo ya configurado se oculta automáticamente"
      />

      {setupStatus.productionLive && (
        <Card glow className="border-positive/30">
          <p className="text-sm text-neutral-300">
            <strong className="text-positive">Producción activa</strong> — backend Firebase.
            Secrets {setupStatus.firebaseSecretsReady ? "listos" : "pendientes"}.
            {setupStatus.mapsReady ? " Mapa con Google Maps." : ""}
          </p>
        </Card>
      )}

      <Card glow className="border-accent/30">
        <p className="text-sm text-neutral-300">
          <strong className="text-white">Operación diaria:</strong> crea tu evento en{" "}
          <Link to="/configuracion" className="text-accent hover:underline">
            Configuración → Asistente
          </Link>{" "}
          (evento, sitios, tarifas, QR).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/panel"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40"
          >
            ← Volver al panel
          </Link>
          <a
            href={deployLinks?.descargasUrl ?? "/descargas"}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40"
          >
            Descargas multiplataforma
          </a>
        </div>
      </Card>

      {pendingSteps.length === 0 ? (
        <Card className="border-positive/30">
          <p className="text-sm text-neutral-300">
            No hay pasos de infraestructura pendientes. Siguiente paso:{" "}
            <Link to="/configuracion" className="font-semibold text-accent hover:underline">
              configurar tu primer evento
            </Link>
            .
          </p>
        </Card>
      ) : (
        pendingSteps.map((step) => <GuideBlock key={step.id} step={step} />)
      )}

      {completedSteps.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-neutral-400 hover:text-neutral-200">
            Ver {completedSteps.length} paso(s) ya completados
          </summary>
          <div className="mt-3 space-y-3">
            {completedSteps.map((step) => (
              <GuideBlock key={step.id} step={step} done />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
