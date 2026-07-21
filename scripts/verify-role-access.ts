/**
 * Verifica jerarquía de creación y menú visible por rol.
 */
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  ROLE_CATALOG,
  ROLE_LABEL,
  WORKER_SELF_PERMISSIONS,
  comunicacionPath,
  notificationsPath,
  puedeAccederPlataforma,
  rewriteWorkerDeepLinkForRole,
  rolesAsignablesPor,
  rolesCuentaPlataforma,
  rolesPersonalCampo,
  type UserRole,
} from "../packages/shared/src";
import {
  getAdminNavSections,
  getMasterNavSections,
  getWorkerNavItems,
} from "../apps/admin/src/config/navigation";

const ROOT: UserRole[] = ["ceo", "master_app"];
const ADMIN_ROLES: UserRole[] = [
  "administrador",
  "recursos_humanos",
  "contador",
  "supervisor_sitio",
];

function pathsOf(sections: { items: { to: string }[] }[]): string[] {
  return sections.flatMap((s) => s.items.map((i) => i.to.split("?")[0] ?? i.to));
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function main(): void {
  // Solo raíces pueden crear Administrador
  for (const root of ROOT) {
    assert(
      rolesAsignablesPor(root).includes("administrador"),
      `${root} debe poder crear administrador`,
    );
    assert(
      rolesCuentaPlataforma(root).includes("recursos_humanos"),
      `${root} debe poder crear RH`,
    );
    assert(
      rolesCuentaPlataforma(root).includes("contador"),
      `${root} debe poder crear Contabilidad`,
    );
  }

  assert(
    !rolesAsignablesPor("contador").length,
    "Contabilidad no debe crear cuentas",
  );
  assert(
    rolesPersonalCampo("recursos_humanos").includes("supervisor_sitio"),
    "RH debe poder crear supervisores",
  );
  assert(
    rolesPersonalCampo("supervisor_sitio").includes("trabajador"),
    "Supervisor debe poder crear empleados",
  );
  assert(
    !rolesAsignablesPor("administrador").includes("administrador"),
    "Administrador no se auto-replica a nivel peer",
  );

  // Master solo para raíces
  const masterPaths = pathsOf(getMasterNavSections());
  assert(masterPaths.includes("/master/administradores"), "Master debe tener equipo admin");
  assert(masterPaths.includes("/master/trabajadores"), "Master/CEO debe ver trabajadores en vivo");
  assert(masterPaths.includes("/master/comunicacion"), "Master/CEO debe acceder al chat");
  assert(masterPaths.includes("/master/personal"), "CEO/Master debe gestionar personal en la misma consola");
  assert(masterPaths.includes("/master/configuracion"), "CEO/Master debe configurar eventos en la misma consola");
  assert(masterPaths.includes("/master/reportes"), "CEO/Master debe ver reportes de campo en la misma consola");
  assert(masterPaths.includes("/master/panel"), "CEO/Master debe ver panel operativo sin salir de /master");

  // CEO: empresa completa vía admin; nunca app de empleado
  assert(puedeAccederPlataforma("ceo", "admin"), "CEO debe acceder a consola admin");
  assert(puedeAccederPlataforma("ceo", "master"), "CEO debe acceder a consola master");
  assert(!puedeAccederPlataforma("ceo", "worker"), "CEO no debe ser app de empleado");
  for (const perm of WORKER_SELF_PERMISSIONS) {
    assert(
      !DEFAULT_PERMISSIONS_BY_ROLE.ceo.includes(perm),
      `CEO no debe tener permiso de empleado: ${perm}`,
    );
  }
  assert(
    DEFAULT_PERMISSIONS_BY_ROLE.ceo.includes("gestionar_personal"),
    "CEO debe poder gestionar personal",
  );
  assert(
    DEFAULT_PERMISSIONS_BY_ROLE.ceo.includes("ver_reportes_trabajadores"),
    "CEO debe poder ver reportes",
  );
  assert(
    DEFAULT_PERMISSIONS_BY_ROLE.ceo.includes("gestionar_configuracion"),
    "CEO debe poder configurar eventos",
  );

  const ceoAdminPaths = pathsOf(getAdminNavSections("ceo"));
  assert(ceoAdminPaths.includes("/personal"), "Menú admin CEO debe incluir Personal");
  assert(ceoAdminPaths.includes("/configuracion"), "Menú admin CEO debe incluir Configuración");
  assert(ceoAdminPaths.includes("/reportes"), "Menú admin CEO debe incluir Reportes");

  // Contabilidad: finanzas sí, operación de campo no
  const contPaths = pathsOf(getAdminNavSections("contador"));
  assert(contPaths.includes("/nomina"), "Contabilidad debe ver nómina");
  assert(contPaths.includes("/negocio"), "Contabilidad debe ver negocio");
  assert(!contPaths.includes("/personal"), "Contabilidad no debe ver personal");
  assert(!contPaths.includes("/configuracion"), "Contabilidad no debe crear eventos");
  assert(!contPaths.includes("/equipo-admin"), "Contabilidad no crea cuentas admin");

  // RH: personal sí, nómina/negocio no
  const rhPaths = pathsOf(getAdminNavSections("recursos_humanos"));
  assert(rhPaths.includes("/personal"), "RH debe ver personal");
  assert(rhPaths.includes("/cuentas"), "RH debe ver invitaciones");
  assert(!rhPaths.includes("/nomina"), "RH no debe ver nómina");
  assert(!rhPaths.includes("/negocio"), "RH no debe ver negocio");
  assert(!rhPaths.includes("/configuracion"), "RH no crea eventos");

  // Supervisor: campo sí, finanzas no
  const supPaths = pathsOf(getAdminNavSections("supervisor_sitio"));
  assert(supPaths.includes("/turnos"), "Supervisor debe ver turnos");
  assert(supPaths.includes("/personal"), "Supervisor puede registrar personal");
  assert(supPaths.includes("/comunicacion"), "Supervisor debe ver chat en admin");
  assert(!supPaths.includes("/nomina"), "Supervisor no debe ver nómina");
  assert(!supPaths.includes("/negocio"), "Supervisor no debe ver negocio");
  assert(!supPaths.includes("/configuracion"), "Supervisor no crea eventos");
  assert(!supPaths.includes("/equipo-admin"), "Supervisor no crea cuentas admin");

  // Administrador: flujo completo
  const admPaths = pathsOf(getAdminNavSections("administrador"));
  assert(admPaths.includes("/configuracion"), "Admin debe crear eventos");
  assert(admPaths.includes("/equipo-admin"), "Admin crea RH/Contabilidad");
  assert(admPaths.includes("/personal"), "Admin ve personal");
  assert(admPaths.includes("/nomina"), "Admin ve nómina");
  assert(admPaths.includes("/negocio"), "Admin ve negocio");

  // Empleado: solo app de campo
  const workerPaths = getWorkerNavItems().map((i) => i.to);
  assert(workerPaths.includes("/worker/entrada"), "Empleado debe escanear QR");
  assert(!workerPaths.some((p) => p.startsWith("/panel")), "Empleado no ve panel admin");
  assert(puedeAccederPlataforma("trabajador", "worker"), "Empleado accede a worker");
  assert(!puedeAccederPlataforma("trabajador", "admin"), "Empleado no accede a admin");

  // Chat: supervisor NO usa /worker (rompe PlatformGate); empleado sí.
  assert(
    comunicacionPath("supervisor_sitio") === "/comunicacion",
    "Supervisor debe abrir chat en consola admin",
  );
  assert(
    notificationsPath("supervisor_sitio") === "/notificaciones",
    "Supervisor debe abrir notificaciones en consola admin",
  );
  assert(
    comunicacionPath("trabajador") === "/worker/comunicacion",
    "Empleado abre chat en app de campo",
  );
  assert(
    comunicacionPath("ceo") === "/master/comunicacion",
    "CEO abre chat en consola master",
  );
  assert(
    !puedeAccederPlataforma("supervisor_sitio", "worker"),
    "Supervisor no debe entrar a app worker",
  );
  assert(
    rewriteWorkerDeepLinkForRole("supervisor_sitio", "/worker/comunicacion", "?dm=x") ===
      "/comunicacion?dm=x",
    "Deep link viejo de chat debe reescribirse para supervisor",
  );

  // Etiquetas del catálogo
  for (const role of [...ROOT, ...ADMIN_ROLES, "trabajador"] as UserRole[]) {
    assert(Boolean(ROLE_LABEL[role]), `Falta ROLE_LABEL para ${role}`);
    assert(Boolean(ROLE_CATALOG[role].resumen), `Falta resumen para ${role}`);
  }

  console.log("✓ Acceso por rol OK:", {
    raiz: ROOT.map((r) => ROLE_LABEL[r]),
    ceoEmpresa: DEFAULT_PERMISSIONS_BY_ROLE.ceo.length,
    menus: {
      administrador: admPaths.length,
      ceoAdmin: ceoAdminPaths.length,
      master: masterPaths.length,
      recursos_humanos: rhPaths.length,
      contador: contPaths.length,
      supervisor_sitio: supPaths.length,
      trabajador: workerPaths.length,
    },
  });
}

main();
