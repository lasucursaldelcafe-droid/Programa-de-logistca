import type { UserRole } from "./types";
import { esRolMaster, normalizeUserRole } from "./accounts";

/** Rutas del panel trabajador en la app unificada. */
export function workerPath(segment = ""): string {
  const clean = segment.replace(/^\//, "");
  return clean ? `/worker/${clean}` : "/worker";
}

/**
 * Solo el rol Empleado usa /worker/*.
 * Supervisor y oficina van a consola admin; dirección a /master.
 */
export function notificationsPath(role: UserRole): string {
  const r = normalizeUserRole(role);
  if (r === "trabajador") return workerPath("notificaciones");
  if (esRolMaster(r)) return "/master/notificaciones";
  return "/notificaciones";
}

export function comunicacionPath(role: UserRole): string {
  const r = normalizeUserRole(role);
  if (r === "trabajador") return workerPath("comunicacion");
  if (esRolMaster(r)) return "/master/comunicacion";
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

/**
 * Si un rol no-empleado abre un deep link viejo de /worker/*,
 * reescribe a la ruta correcta de su consola (admin o master).
 */
export function rewriteWorkerDeepLinkForRole(
  role: UserRole,
  workerPathname: string,
  search = "",
): string | null {
  if (normalizeUserRole(role) === "trabajador") return null;
  const path = workerPathname.replace(/\/$/, "") || "/worker";
  const qs = search.startsWith("?") || search === "" ? search : `?${search}`;

  if (path === "/worker/comunicacion" || path.endsWith("/comunicacion")) {
    return `${comunicacionPath(role)}${qs}`;
  }
  if (path === "/worker/notificaciones" || path.endsWith("/notificaciones")) {
    return `${notificationsPath(role)}${qs}`;
  }
  if (path === "/worker/ayuda" || path.endsWith("/ayuda")) {
    return esRolMaster(role) ? `/master/ayuda${qs}` : `/ayuda${qs}`;
  }
  if (path === "/worker/turnos" || path.endsWith("/turnos")) {
    return `/turnos${qs}`;
  }
  if (path === "/worker" || path === "/worker/entrada" || path === "/worker/reportar") {
    return `${rutaHomeCompat(role)}${qs}`;
  }
  return `${rutaHomeCompat(role)}${qs}`;
}

function rutaHomeCompat(role: UserRole): string {
  if (esRolMaster(role)) return "/master";
  if (normalizeUserRole(role) === "trabajador") return "/worker";
  return "/panel";
}
