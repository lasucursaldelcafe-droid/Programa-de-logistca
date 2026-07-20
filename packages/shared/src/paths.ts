import type { UserRole } from "./types";

/** Rutas del panel trabajador en la app unificada. */
export function workerPath(segment = ""): string {
  const clean = segment.replace(/^\//, "");
  return clean ? `/worker/${clean}` : "/worker";
}

export function notificationsPath(role: UserRole): string {
  if (role === "trabajador" || role === "supervisor_sitio") {
    return workerPath("notificaciones");
  }
  return "/notificaciones";
}

export function comunicacionPath(role: UserRole): string {
  if (role === "trabajador" || role === "supervisor_sitio") {
    return workerPath("comunicacion");
  }
  return "/comunicacion";
}

/** Resuelve enlace según contexto actual (admin vs worker). */
export function resolveTurnosPath(pathname: string): string {
  return pathname.startsWith("/worker") ? workerPath("turnos") : "/turnos";
}

export function resolveEntradaPath(_pathname: string): string {
  return workerPath("entrada");
}
