/**
 * Verifica jerarquía de creación y menú visible por rol.
 */
import {
  ROLE_CATALOG,
  ROLE_LABEL,
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

  // Etiquetas del catálogo
  for (const role of [...ROOT, ...ADMIN_ROLES, "trabajador"] as UserRole[]) {
    assert(Boolean(ROLE_LABEL[role]), `Falta ROLE_LABEL para ${role}`);
    assert(Boolean(ROLE_CATALOG[role].resumen), `Falta resumen para ${role}`);
  }

  console.log("✓ Acceso por rol OK:", {
    raiz: ROOT.map((r) => ROLE_LABEL[r]),
    menus: {
      administrador: admPaths.length,
      recursos_humanos: rhPaths.length,
      contador: contPaths.length,
      supervisor_sitio: supPaths.length,
      trabajador: workerPaths.length,
    },
  });
}

main();
