import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getSetupGuideSteps, type SetupGuideStep } from "@spe/shared";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import { PageHeader } from "../components/nav/PageHeader";
import { Card } from "../components/ui";

const priorityStyle = {
  p0: "bg-alert/15 text-alert",
  p1: "bg-accent/15 text-accent",
  p2: "bg-neutral-700/50 text-neutral-400",
} as const;

function GuideBlock({ step }: { step: SetupGuideStep }) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyle[step.priority]}`}
          >
            {step.priority === "p0" ? "Urgente" : step.priority === "p1" ? "Importante" : "Próximo"}
          </span>
          <h2 className="mt-2 font-display text-lg font-semibold">{step.title}</h2>
          <p className="mt-1 text-sm text-neutral-400">{step.summary}</p>
        </div>
      </div>

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

      <p className="text-xs text-neutral-500">
        <span className="text-positive">✓ Listo cuando:</span> {step.doneWhen}
      </p>
    </Card>
  );
}

export function PendientesPage() {
  const deployLinks = useDeploymentLinks();
  const steps = useMemo(
    () =>
      getSetupGuideSteps(
        deployLinks
          ? {
              pagesUrl: deployLinks.pagesUrl,
              repoUrl: deployLinks.repoUrl,
              actionsUrl: deployLinks.actionsUrl,
              owner: deployLinks.owner,
              repo: deployLinks.repo,
            }
          : undefined,
      ),
    [deployLinks],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Configuración pendiente"
        description="Pasos en orden, con credenciales y links directos"
      />

      <Card glow className="border-accent/30">
        <p className="text-sm text-neutral-300">
          <strong className="text-white">¿Dónde está el menú lateral?</strong> En PC aparece a la
          izquierda. En móvil pulsa el icono{" "}
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs">☰</span> arriba
          a la izquierda. Cada categoría se despliega al tocar su nombre.
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

      {steps.map((step) => (
        <GuideBlock key={step.id} step={step} />
      ))}
    </div>
  );
}
