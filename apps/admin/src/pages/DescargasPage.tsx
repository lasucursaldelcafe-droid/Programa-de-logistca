import { Link } from "react-router-dom";
import { useMemo } from "react";
import { buildLoginUrl,
  getPlatformDownloads,
  getSetupChecklist,
  type SetupChecklistItem,
} from "@spe/shared";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import { useReleaseAssets } from "../hooks/useReleaseAssets";
import { useProductionSetupStatusLive } from "../hooks/useProductionSetupStatus";
import { authButtonClass } from "../components/AuthShell";

const priorityLabel = {
  p0: { text: "Urgente", className: "bg-alert/15 text-alert" },
  p1: { text: "Importante", className: "bg-accent/15 text-accent" },
  p2: { text: "Próximo", className: "bg-neutral-700/50 text-neutral-400" },
} as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ChecklistRow({ item }: { item: SetupChecklistItem }) {
  const badge = priorityLabel[item.priority];
  return (
    <li className="spe-glass spe-hover-lift rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.className}`}>
              {badge.text}
            </span>
            <h3 className="font-display text-base font-semibold text-white">{item.title}</h3>
          </div>
          <p className="mt-1 text-sm text-neutral-400">{item.description}</p>
          {item.doneHint && (
            <p className="mt-2 text-xs text-neutral-500">✓ Listo cuando: {item.doneHint}</p>
          )}
        </div>
        <a
          href={item.href}
          target={item.href.startsWith("http") ? "_blank" : undefined}
          rel={item.href.startsWith("http") ? "noreferrer" : undefined}
          className="shrink-0 rounded-xl bg-accent/15 px-4 py-2 text-sm font-semibold text-accent ring-1 ring-accent/30 transition hover:bg-accent/25"
        >
          {item.actionLabel} →
        </a>
      </div>
    </li>
  );
}

export function DescargasPage() {
  const deployLinks = useDeploymentLinks();
  const base = deployLinks ?? {
    pagesUrl: "https://lasucursaldelcafe-droid.github.io/Programa-de-logistca/",
    repoUrl: "https://github.com/lasucursaldelcafe-droid/Programa-de-logistca",
    actionsUrl: "https://github.com/lasucursaldelcafe-droid/Programa-de-logistca/actions",
    owner: "lasucursaldelcafe-droid",
    repo: "Programa-de-logistca",
  };

  const platformSpecs = useMemo(() => getPlatformDownloads(base), [base.pagesUrl, base.repoUrl, base.actionsUrl, base.owner, base.repo]);
  const setupStatus = useProductionSetupStatusLive();
  const checklist = useMemo(() => getSetupChecklist(base, setupStatus), [base, setupStatus]);
  const { loading, tagName, platforms } = useReleaseAssets(deployLinks, platformSpecs);
  const adminLogin = buildLoginUrl(base.pagesUrl);

  return (
    <div className="spe-page-bg min-h-screen">
      <div className="spe-page-mesh pointer-events-none fixed inset-0" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-10 text-center">
          <div className="spe-brand-glow mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <span className="font-display text-2xl font-bold text-accent">SPE</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Descargas y accesos
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-400">
            Una sola app para Admin, Master y Trabajador. Elige tu plataforma o revisa lo que falta
            configurar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={adminLogin} className={authButtonClass}>
              Entrar como admin (automático)
            </a>
            <Link
              to="/login"
              className="rounded-xl border border-border bg-surface/80 px-5 py-2.5 text-sm font-semibold text-neutral-200 backdrop-blur transition hover:border-accent/40"
            >
              Ir al login
            </Link>
          </div>
        </header>

        <section className="mb-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold">Plataformas</h2>
              <p className="text-sm text-neutral-500">
                {loading
                  ? "Buscando última versión…"
                  : tagName
                    ? `Release ${tagName}`
                    : "Instaladores en GitHub Releases (generándose…)"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map(({ spec, href, available, assetName }) => (
              <article
                key={spec.id}
                className="spe-glass spe-hover-lift flex flex-col rounded-2xl p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-3xl" aria-hidden>
                    {spec.icon}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      available
                        ? "bg-positive/15 text-positive"
                        : "bg-neutral-700/50 text-neutral-500"
                    }`}
                  >
                    {available ? "Disponible" : "Ver release"}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold">{spec.label}</h3>
                <p className="mt-1 flex-1 text-sm text-neutral-400">{spec.description}</p>
                {assetName && (
                  <p className="mt-2 truncate font-mono text-[10px] text-neutral-500">{assetName}</p>
                )}
                <ol className="mt-3 space-y-1 text-xs text-neutral-500">
                  {spec.installSteps.map((step) => (
                    <li key={step}>• {step}</li>
                  ))}
                </ol>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:brightness-110"
                >
                  {spec.id === "web" || spec.id === "ios" ? "Abrir app" : "Descargar"}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="font-display text-xl font-semibold">
              {checklist.length > 0 ? "Pendientes con enlace directo" : "Infraestructura lista"}
            </h2>
            <p className="text-sm text-neutral-500">
              {checklist.length > 0
                ? "Cada ítem abre la pantalla o documento correcto — sin buscar en menús."
                : "Sheets, Firebase Secrets y mapa ya están configurados. Configura tu evento en el asistente."}
            </p>
          </div>
          {checklist.length > 0 ? (
            <ul className="space-y-3">
              {checklist.map((item) => (
                <ChecklistRow key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <Link
              to="/configuracion"
              className="inline-block rounded-xl bg-accent/15 px-4 py-2 text-sm font-semibold text-accent ring-1 ring-accent/30"
            >
              Ir al asistente de evento →
            </Link>
          )}
        </section>

        <footer className="mt-12 border-t border-border/60 pt-6 text-center text-xs text-neutral-500">
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
          {" · "}
          <Link to="/ayuda" className="text-accent hover:underline">
            Ayuda
          </Link>
          {" · "}
          <a href={base.repoUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Repositorio
          </a>
        </footer>
      </div>
    </div>
  );
}
