export type Platform = "admin" | "worker" | "master";

const ADMIN_INSTRUCCIONES = [
  {
    title: "1. Preparar el evento",
    steps: [
      "Ve a Configuración y crea o selecciona el evento activo.",
      "En QR Sitios define cada ubicación con coordenadas GPS.",
      "Genera e imprime los códigos QR de cada punto de entrada.",
    ],
  },
  {
    title: "2. Registrar personal y roles",
    steps: [
      "En Personal registra cada persona con su nombre, documento y correo.",
      "El administrador asigna el rol: Trabajador o Supervisor de sitio.",
      "En Cuentas envía la invitación; la persona crea su contraseña al activar.",
    ],
  },
  {
    title: "3. Operación del día",
    steps: [
      "Crea turnos asignando trabajador + sitio + horario.",
      "Monitorea el Mapa en vivo y atiende Reportes de incidencias.",
      "Revisa Notificaciones de entradas y alertas de geocerca.",
    ],
  },
  {
    title: "4. Cierre",
    steps: [
      "Calcula nómina según asistencia registrada.",
      "Exporta reportes e informes para la empresa.",
    ],
  },
];

const WORKER_INSTRUCCIONES = [
  {
    title: "Primera vez — activar cuenta",
    steps: [
      "Abre el enlace del correo de invitación o usa «Unirme a la empresa».",
      "Ingresa el código de 6 dígitos (solo funciona una vez, no lo compartas).",
      "Crea tu contraseña y completa tu perfil.",
    ],
  },
  {
    title: "Cada jornada",
    steps: [
      "Revisa tus turnos y confirma o rechaza.",
      "Al llegar al sitio, pestaña Escanear → lee el QR del punto.",
      "Permite GPS: el sistema valida que estás en el sitio asignado.",
      "Si hay un problema, usa Reportar para avisar al supervisor.",
    ],
  },
];

const MASTER_INSTRUCCIONES = [
  {
    title: "Supervisión global",
    steps: [
      "Revisa el panel de informes de toda la plataforma.",
      "Gestiona administradores y permisos.",
      "Exporta CSV y audita nómina y movimientos sensibles.",
    ],
  },
];

const SECTIONS: Record<Platform, typeof ADMIN_INSTRUCCIONES> = {
  admin: ADMIN_INSTRUCCIONES,
  worker: WORKER_INSTRUCCIONES,
  master: MASTER_INSTRUCCIONES,
};

interface InstruccionesOperacionProps {
  platform: Platform;
  compact?: boolean;
}

export function InstruccionesOperacion({ platform, compact = false }: InstruccionesOperacionProps) {
  const sections = SECTIONS[platform];

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h3
            className={
              compact
                ? "text-sm font-semibold text-white"
                : "text-lg font-medium text-white"
            }
          >
            {section.title}
          </h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-neutral-300">
            {section.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
