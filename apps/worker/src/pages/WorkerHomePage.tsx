import { Link } from "react-router-dom";
import { workerPath } from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { Card } from "@core/components/ui";
import {
  getActiveAttendance,
  useAttendances,
  useShifts,
} from "@core/hooks/useDataStore";
import { SHIFT_LABEL } from "@spe/shared";

export function WorkerHomePage() {
  const { user } = useAuth();
  const shifts = useShifts();
  const attendances = useAttendances();

  if (!user?.workerId) {
    return <p className="text-neutral-400">Perfil de trabajador no vinculado.</p>;
  }

  const misTurnos = shifts.filter((s) => s.workerId === user.workerId);
  const pendientes = misTurnos.filter((s) => s.estado === "pendiente");
  const activo = getActiveAttendance(attendances, user.workerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Hola, {user.nombre}</h1>
        <p className="mt-1 text-sm text-neutral-400">Tu jornada y turnos del evento</p>
      </div>

      {activo ? (
        <Card className="border-positive/30 bg-positive/5">
          <p className="text-sm font-medium text-positive">Jornada activa</p>
          <p className="mt-1 text-neutral-300">{activo.siteNombre}</p>
          <Link
            to={workerPath("entrada")}
            className="mt-3 inline-block text-sm text-accent hover:underline"
          >
            Ver entrada / marcar salida
          </Link>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-neutral-400">Sin jornada activa</p>
          <Link
            to={workerPath("entrada")}
            className="mt-2 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
          >
            Escanear QR de entrada
          </Link>
        </Card>
      )}

      {pendientes.length > 0 && (
        <Card>
          <h2 className="font-display font-semibold">Turnos por confirmar</h2>
          <ul className="mt-3 space-y-2">
            {pendientes.map((t) => (
              <li key={t.id} className="text-sm text-neutral-300">
                {t.siteNombre} — {SHIFT_LABEL[t.estado]}
              </li>
            ))}
          </ul>
          <Link to={workerPath("turnos")} className="mt-3 text-sm text-accent hover:underline">
            Ir a turnos
          </Link>
        </Card>
      )}
    </div>
  );
}
