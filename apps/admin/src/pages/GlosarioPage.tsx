import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/nav/PageHeader";
import { Card } from "../components/ui";
import {
  filterGlossaryEntries,
  GLOSSARY_CATEGORIES,
  type GlossaryCategoryId,
} from "../config/glossary";

interface GlosarioPageProps {
  /** Prefijo de rutas de herramientas (admin vs master vs worker). */
  toolBase?: "admin" | "master" | "worker";
}

function resolveToolPath(path: string | undefined, base: GlosarioPageProps["toolBase"]): string | null {
  if (!path) return null;
  if (base === "worker") {
    return path.startsWith("/worker") ? path : null;
  }
  if (base === "master") {
    if (path.startsWith("/master") || path.startsWith("/worker")) return path;
    if (path === "/panel") return "/master/panel";
    if (path === "/equipo-admin") return "/master/administradores";
    if (path === "/mapa") return "/master/supervision";
    return `/master${path}`;
  }
  // admin: enlaces master-only se dejan; el redirect del CEO los unifica
  return path;
}

export function GlosarioPage({ toolBase = "admin" }: GlosarioPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GlossaryCategoryId | "">("");

  const entries = useMemo(
    () => filterGlossaryEntries(query, category),
    [query, category],
  );

  const ayudaPath =
    toolBase === "master" ? "/master/ayuda" : toolBase === "worker" ? "/worker/ayuda" : "/ayuda";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Glosario y tutorial"
        description="Aquí se explica qué hace cada cosa. Las herramientas (crear turnos, personal, mapa…) están en el menú; este apartado solo enseña."
      />

      <Card className="border-accent/20 bg-accent/5">
        <p className="text-sm text-neutral-300">
          ¿Buscas abrir una pantalla? Usa la barra <strong className="text-white">Buscar opciones</strong>{" "}
          del menú (o Ctrl+K). ¿Quieres entender un concepto? Quédate en este glosario.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Guía rápida y FAQ:{" "}
          <Link to={ayudaPath} className="text-accent underline">
            Ayuda
          </Link>
          .
        </p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-neutral-400">Buscar en el glosario</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. turno, GPS, nómina, CEO…"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2"
          />
        </label>
        <label className="block text-sm sm:w-56">
          <span className="mb-1 block text-neutral-400">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GlossaryCategoryId | "")}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2"
          >
            <option value="">Todas</option>
            {GLOSSARY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!category && !query.trim() && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className="rounded-lg border border-border bg-surface px-4 py-3 text-left transition hover:border-accent/40 hover:bg-surface-elevated"
            >
              <p className="font-medium text-neutral-100">{c.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{c.description}</p>
            </button>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">Ninguna entrada coincide con la búsqueda.</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => {
            const cat = GLOSSARY_CATEGORIES.find((c) => c.id === entry.category);
            const tool = resolveToolPath(entry.toolPath, toolBase);
            return (
              <li key={entry.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        {cat?.title ?? entry.category}
                      </p>
                      <h2 className="mt-1 font-display text-lg font-semibold text-neutral-100">
                        {entry.title}
                      </h2>
                    </div>
                    {tool && (
                      <Link
                        to={tool}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-accent hover:border-accent/40"
                      >
                        Ir a la herramienta →
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-neutral-300">{entry.summary}</p>
                  {entry.details.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-400">
                      {entry.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
