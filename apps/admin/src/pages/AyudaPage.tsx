import { Link } from "react-router-dom";
import { InstruccionesOperacion, type Platform } from "../components/InstruccionesOperacion";

export type { Platform };

const PLATFORM_TITLE: Record<Platform, string> = {
  admin: "Admin Console",
  worker: "App Trabajador",
  master: "Master Console",
};

const PLATFORM_STEPS: Record<Platform, string[]> = {
  admin: [
    "Configura el evento y los sitios GPS en QR Sitios.",
    "Registra personal y envía invitaciones desde Cuentas.",
    "Crea turnos con trabajador, sitio y horario.",
    "Monitorea el mapa en vivo y atiende reportes de incidencias.",
    "Cierra nómina al final del evento.",
  ],
  worker: [
    "Activa tu cuenta con el enlace de invitación.",
    "Completa tu perfil y acepta los turnos asignados.",
    "Al llegar al sitio, escanea el QR y valida tu ubicación GPS.",
    "Si hay un problema, usa Reportar para avisar al supervisor.",
  ],
  master: [
    "Revisa el panel global de la operación.",
    "Gestiona administradores y permisos de plataforma.",
    "Exporta informes CSV para análisis.",
    "Audita nómina y movimientos sensibles.",
  ],
};

const DEMO_ACCOUNTS: { platform: Platform; email: string; password: string; note?: string }[] = [
  { platform: "master", email: "master@eventos.test", password: "Master123!", note: "Plataforma" },
  { platform: "admin", email: "admin@eventos.test", password: "Admin123!", note: "Administrador único" },
];

interface AyudaPageProps {
  platform: Platform;
}

export function AyudaPage({ platform }: AyudaPageProps) {
  const accounts = DEMO_ACCOUNTS.filter((a) => a.platform === platform);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Guía de uso</h1>
        <p className="mt-2 text-neutral-400">
          {PLATFORM_TITLE[platform]} — Sistema de Personal para Eventos
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Instrucciones de operación</h2>
        <InstruccionesOperacion platform={platform} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Resumen rápido</h2>
        <ol className="list-decimal space-y-2 pl-5 text-neutral-300">
          {PLATFORM_STEPS[platform].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Las 3 plataformas</h2>
        <ul className="space-y-2 text-sm text-neutral-300">
          <li>
            <strong className="text-white">Admin Console</strong> — administradores y
            supervisores: eventos, turnos, QR, mapa, nómina, reportes.
          </li>
          <li>
            <strong className="text-white">App Trabajador</strong> — personal de campo:
            turnos, escanear QR, GPS, reportar incidencias.
          </li>
          <li>
            <strong className="text-white">Master Console</strong> — super administrador:
            informes globales, administradores, auditoría.
          </li>
        </ul>
        <p className="text-sm text-neutral-500">
          Cada plataforma valida tu rol al iniciar sesión. Usa la URL que corresponde a tu
          puesto.
        </p>
      </section>

      {accounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-white">Cuentas de prueba (demo)</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-neutral-400">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Contraseña</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-neutral-300">
                {accounts.map((a) => (
                  <tr key={a.email}>
                    <td className="px-4 py-2 font-mono text-xs">{a.email}</td>
                    <td className="px-4 py-2 font-mono text-xs">{a.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Preguntas frecuentes</h2>
        <dl className="space-y-4 text-sm text-neutral-300">
          <div>
            <dt className="font-medium text-white">¿Por qué no puedo entrar?</dt>
            <dd className="mt-1">
              Verifica que estás en la plataforma correcta para tu rol. Un trabajador no
              puede acceder al Admin ni al Master.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-white">¿Cómo se asigna la ubicación?</dt>
            <dd className="mt-1">
              Por turno: cada turno indica el sitio GPS donde debes marcar entrada ese día.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-white">¿El GPS es obligatorio?</dt>
            <dd className="mt-1">
              Sí, al escanear el QR el sistema valida que estás cerca del sitio asignado.
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-sm text-neutral-500">
        <Link to="/login" className="text-accent hover:underline">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
