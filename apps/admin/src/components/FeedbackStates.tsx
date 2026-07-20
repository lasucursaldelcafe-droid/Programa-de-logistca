import { Link } from "react-router-dom";
import { rutaHomePorRol, type UserRole } from "@spe/shared";

/** Pantalla de carga uniforme en guards y rutas protegidas. */
export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-neutral-400"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Skeleton para listas/tablas mientras llegan datos de Firestore. */
export function DataLoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 rounded-lg bg-neutral-800/80" />
      ))}
    </div>
  );
}

interface PermissionDeniedProps {
  title?: string;
  description?: string;
  role?: UserRole;
}

/** Estado cuando el usuario no tiene permiso para la página. */
export function PermissionDenied({
  title = "Sin permiso",
  description = "Tu rol no puede acceder a esta sección.",
  role,
}: PermissionDeniedProps) {
  const home = role ? rutaHomePorRol(role) : "/panel";
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-bg/50 p-6 text-center">
      <h1 className="font-display text-xl font-semibold text-white">{title}</h1>
      <p className="text-sm text-neutral-400">{description}</p>
      <Link
        to={home}
        className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent/90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
