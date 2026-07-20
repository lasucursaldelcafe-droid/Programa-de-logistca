/**
 * Rutas estáticas espejadas en GitHub Pages (cada una → index.html).
 * Fuente única para prepare-pages.ts y verificación CI.
 */
export const SPA_MIRROR_ROUTES: readonly string[] = [
  "login",
  "configurar",
  "ayuda",
  "unirse",
  "completar-perfil",
  "panel",
  "personal",
  "turnos",
  "cuentas",
  "qr-sitios",
  "mapa",
  "reportes",
  "notificaciones",
  "nomina",
  "configuracion",
  "clientes",
  "facturacion",
  "inventario",
  "integraciones",
  "descargas",
  "pendientes",
  "supervision",
  "master",
  "master/administradores",
  "master/informes",
  "master/auditoria",
  "master/ayuda",
  "worker",
  "worker/turnos",
  "worker/entrada",
  "worker/reportar",
  "worker/notificaciones",
  "worker/ayuda",
] as const;

/** Rutas críticas que CI debe verificar tras el build. */
export const SPA_CRITICAL_ROUTES: readonly string[] = [
  "descargas",
  "pendientes",
  "notificaciones",
  "worker/notificaciones",
  "worker/ayuda",
  "master/ayuda",
] as const;
