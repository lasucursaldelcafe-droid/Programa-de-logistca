import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { QuickActionDef } from "../../config/kpiShortcuts";

interface QuickConfigSheetProps {
  open: boolean;
  title: string;
  hint: string;
  /** Valor mostrado del resumen (número o texto). */
  value?: string | number;
  valueLabel?: string;
  actions: QuickActionDef[];
  onClose: () => void;
  /** Contenido extra (filtros / formulario embebido). */
  children?: ReactNode;
}

/**
 * Panel de configuración rápida al pulsar un KPI del resumen.
 * Accesos directos a la acción resumida + enlace a la pantalla completa.
 */
export function QuickConfigSheet({
  open,
  title,
  hint,
  value,
  valueLabel,
  actions,
  onClose,
  children,
}: QuickConfigSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-config-title"
      onClick={onClose}
    >
      <div
        className="spe-glass max-h-[min(92dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/80 p-4 shadow-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              Acceso rápido
            </p>
            <h2 id="quick-config-title" className="mt-0.5 font-display text-xl font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-neutral-400">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {value !== undefined && (
          <div className="mt-4 rounded-xl border border-border/70 bg-bg/50 px-4 py-3">
            <p className="font-mono text-2xl font-bold text-accent">{value}</p>
            {valueLabel && <p className="mt-0.5 text-xs text-neutral-500">{valueLabel}</p>}
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}

        <ul className="mt-4 space-y-2">
          {actions.map((action) => (
            <li key={action.id}>
              <Link
                to={action.to}
                onClick={onClose}
                className={`flex flex-col rounded-xl border px-4 py-3 transition ${
                  action.primary
                    ? "border-accent/40 bg-accent/10 hover:bg-accent/15"
                    : "border-border hover:border-accent/30 hover:bg-neutral-900/50"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    action.primary ? "text-accent" : "text-neutral-100"
                  }`}
                >
                  {action.label}
                </span>
                {action.description && (
                  <span className="mt-0.5 text-xs text-neutral-500">{action.description}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
