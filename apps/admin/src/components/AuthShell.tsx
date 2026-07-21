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
    <div className="spe-login-bg flex min-h-dvh items-center justify-center px-3 py-8 safe-area-inset sm:px-4 sm:py-10">
      <div className={`spe-animate-in w-full min-w-0 ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className="mb-6 text-center">
          <div className="spe-brand-glow mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16">
            <span className="font-display text-xl font-bold text-accent sm:text-2xl">SPE</span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>}
        </div>
        <div className="spe-glass rounded-2xl p-4 sm:p-5 md:p-6">{children}</div>
        {footer && (
          <div className="mt-5 text-center text-xs leading-relaxed text-neutral-500">{footer}</div>
        )}
      </div>
    </div>
  );
}

/** Clases compartidas para inputs y botón primario en pantallas de auth */
export const authInputClass =
  "w-full rounded-xl border border-border bg-bg/80 px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export const authButtonClass =
  "w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition hover:brightness-110 disabled:opacity-50";
