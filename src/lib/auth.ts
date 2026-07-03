export type ProveedorSesion = "local" | "google";

export interface SesionUsuario {
  nombre: string;
  email: string;
  proveedor: ProveedorSesion;
}

const KEY_SESION = "logistica.sesion";

export function leerSesion(): SesionUsuario | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_SESION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SesionUsuario;
    if (!parsed.nombre) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: SesionUsuario): void {
  localStorage.setItem(KEY_SESION, JSON.stringify(sesion));
}

export function cerrarSesion(): void {
  localStorage.removeItem(KEY_SESION);
}

export function decodificarJwt(token: string): { name?: string; email?: string } {
  const base = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "";
  const json = decodeURIComponent(
    atob(base)
      .split("")
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join(""),
  );
  return JSON.parse(json) as { name?: string; email?: string };
}

export function resolverGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
}
