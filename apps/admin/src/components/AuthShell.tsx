import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Formularios más anchos (p. ej. completar perfil) */
  wide?: boolean;
}

/** Layout uniforme para login, invitación, activar cuenta, etc. */
export function AuthShell({ title, subtitle, children, footer, wide }: AuthShellProps) {
  return (
    <div className="spe-login-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/30">
            <span className="font-display text-xl font-bold text-accent">SPE</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-lg shadow-black/20">
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-xs text-neutral-500">{footer}</div>}
      </div>
    </div>
  );
}

/** Clases compartidas para inputs y botón primario en pantallas de auth */
export const authInputClass =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30";

export const authButtonClass =
  "w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black shadow-md shadow-accent/20 transition hover:brightness-110 disabled:opacity-50";
