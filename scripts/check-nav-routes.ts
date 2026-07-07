/**
 * Verifica que los enlaces de navegación apunten a rutas definidas en App.tsx.
 */
import { getAdminNavSections, getMasterNavSections, getWorkerNavItems } from "../apps/admin/src/config/navigation";

const ADMIN_ROUTES = new Set([
  "/panel", "/clientes", "/facturacion", "/inventario", "/integraciones",
  "/supervision", "/personal", "/turnos", "/cuentas", "/qr-sitios", "/mapa",
  "/reportes", "/notificaciones", "/nomina", "/configuracion", "/ayuda",
]);

const MASTER_ROUTES = new Set([
  "/master", "/master/administradores", "/master/informes", "/master/auditoria", "/master/ayuda",
]);

const WORKER_ROUTES = new Set([
  "/worker", "/worker/turnos", "/worker/entrada", "/worker/reportar",
  "/worker/notificaciones", "/worker/ayuda",
]);

const REDIRECTS = new Set(["/marcar-entrada"]);

function checkSections(
  sections: { items: { to: string }[] }[],
  allowed: Set<string>,
  label: string,
): string[] {
  const broken: string[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (!allowed.has(item.to) && !REDIRECTS.has(item.to)) {
        broken.push(`${label}: ${item.to}`);
      }
    }
  }
  return broken;
}

const broken = [
  ...checkSections(getAdminNavSections("administrador"), ADMIN_ROUTES, "admin"),
  ...checkSections(getMasterNavSections(), MASTER_ROUTES, "master"),
  ...getWorkerNavItems()
    .filter((i) => !WORKER_ROUTES.has(i.to))
    .map((i) => `worker: ${i.to}`),
];

if (broken.length > 0) {
  console.error("Enlaces rotos en navegación:\n" + broken.join("\n"));
  process.exit(1);
}

console.log("✓ Navegación: todos los enlaces tienen ruta definida");
