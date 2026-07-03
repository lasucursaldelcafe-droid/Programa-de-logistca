import { Link } from "react-router-dom";
import type { SiteDashboardRow } from "@spe/shared";

export function SiteBreakdown({ rows }: { rows: SiteDashboardRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500">No hay sitios en el filtro actual.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-neutral-500">
            <th className="py-2 pr-4">Sitio</th>
            <th className="py-2 pr-4">Evento</th>
            <th className="py-2 pr-4 text-right">Activos</th>
            <th className="py-2 pr-4 text-right">Alertas</th>
            <th className="py-2 text-right">Turnos 24h</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.siteId} className="border-b border-border/50">
              <td className="py-2 pr-4 font-medium">{row.siteNombre}</td>
              <td className="py-2 pr-4 text-neutral-400">{row.eventNombre ?? "—"}</td>
              <td className="py-2 pr-4 text-right font-mono text-positive">
                {row.jornadasActivas}
              </td>
              <td className="py-2 pr-4 text-right font-mono text-alert">
                {row.alertas}
              </td>
              <td className="py-2 text-right font-mono text-accent">{row.turnosHoy}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/mapa" className="mt-4 inline-block text-sm text-accent hover:underline">
        Abrir mapa en vivo →
      </Link>
    </div>
  );
}
