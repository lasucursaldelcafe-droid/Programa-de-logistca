import { useEffect, useState } from "react";
import {
  getWelcomeContent,
  getWelcomeRoleLabel,
  hasSeenWelcome,
  markWelcomeSeen,
  type AppUser,
  type WelcomeContent,
} from "@spe/shared";

interface WelcomeModalProps {
  user: AppUser;
}

export function WelcomeModal({ user }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<WelcomeContent | null>(null);

  useEffect(() => {
    if (!user.uid || hasSeenWelcome(user.uid)) return;
    // Tras await implícito del tick: evita setState síncrono puro en el efecto.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setContent(getWelcomeContent(user));
      setOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user.uid, user.nombre, user.role]);

  if (!open || !content) return null;

  function handleDismiss(): void {
    markWelcomeSeen(user.uid);
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-accent/30 bg-surface shadow-2xl">
        <div className="border-b border-border bg-gradient-to-br from-accent/15 to-transparent px-5 py-5 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            Nueva sesión · Buen desarrollo
          </p>
          <h2 id="welcome-title" className="mt-1 font-display text-2xl font-bold text-white">
            {content.titulo}
          </h2>
          <p className="mt-2 text-lg text-neutral-200">{content.saludo}</p>
          <p className="mt-1 text-sm text-neutral-400">{getWelcomeRoleLabel(user.role)}</p>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <p className="text-sm leading-relaxed text-neutral-300">{content.mensaje}</p>
          <ul className="space-y-2 text-sm text-neutral-400">
            {content.puntos.map((punto) => (
              <li key={punto} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <span>{punto}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-lg border border-accent/25 bg-accent/10 px-4 py-3 text-sm font-medium text-accent">
            {content.motivacion}
          </p>
          <p className="rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm font-medium text-positive">
            {content.cierre}
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
          >
            Entrar a trabajar
          </button>
        </div>
      </div>
    </div>
  );
}
