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

/** Ruta de chat según pathname actual (admin / worker / master). */
export function resolveComunicacionPath(pathname: string): string {
  if (pathname.startsWith("/worker")) return workerPath("comunicacion");
  if (pathname.startsWith("/master")) return "/master/comunicacion";
  return "/comunicacion";
}

/** Abre chat 1:1 con el Auth UID del empleado. */
export function resolveDirectChatPath(pathname: string, peerUid: string): string {
  const base = resolveComunicacionPath(pathname);
  return `${base}?dm=${encodeURIComponent(peerUid)}`;
}

/** Resuelve enlace según contexto actual (admin vs worker). */
export function resolveTurnosPath(pathname: string): string {
  return pathname.startsWith("/worker") ? workerPath("turnos") : "/turnos";
}

export function resolveEntradaPath(_pathname: string): string {
  return workerPath("entrada");
}
