import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { getFirestoreDb, type Worker, type Turno } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card } from "../components/ui";

export function HomePage() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [shifts, setShifts] = useState<Turno[]>([]);

  useEffect(() => {
    const db = getFirestoreDb();
    const unsubW = onSnapshot(query(collection(db, "workers"), orderBy("nombre")), (snap) => {
      setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker)));
    });
    const unsubS = onSnapshot(query(collection(db, "shifts"), orderBy("inicio")), (snap) => {
      setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Turno)));
    });
    return () => {
      unsubW();
      unsubS();
    };
  }, []);

  const activos = workers.filter((w) => w.estado === "en_sitio").length;
  const pendientes = shifts.filter((s) => s.estado === "pendiente").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Panel operativo</h1>
        <p className="mt-1 text-neutral-400">
          Bienvenido, {user?.nombre}. Resumen en tiempo real (Firestore).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="font-mono text-3xl font-semibold text-accent">
            {workers.length}
          </div>
          <div className="text-sm text-neutral-400">Trabajadores registrados</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-positive">
            {activos}
          </div>
          <div className="text-sm text-neutral-400">En sitio ahora</div>
        </Card>
        <Card>
          <div className="font-mono text-3xl font-semibold text-accent">
            {pendientes}
          </div>
          <div className="text-sm text-neutral-400">Turnos pendientes</div>
        </Card>
      </div>
    </div>
  );
}
