/**
 * Verifica flujos críticos en modo demo (sin Firebase):
 * GPS en asistencia, inhabilitar usuario, reset contraseña.
 */
import type { QrCode, Turno, Worker } from "@spe/shared";

// Mock mínimo para demoLogin en Node
const sessionStore = new Map<string, string>();
(globalThis as { sessionStorage?: Storage }).sessionStorage = {
  getItem: (k: string) => sessionStore.get(k) ?? null,
  setItem: (k: string, v: string) => {
    sessionStore.set(k, v);
  },
  removeItem: (k: string) => {
    sessionStore.delete(k);
  },
  clear: () => sessionStore.clear(),
  key: () => null,
  length: 0,
};

import {
  demoStore,
  demoLogin,
  setDemoAccountHabilitado,
  setDemoAccountPassword,
} from "../apps/admin/src/demo/store";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function seedMinimalData(): { worker: Worker; qr: QrCode; shift: Turno } {
  const workerId = "verify-worker-1";
  const worker: Worker = {
    id: workerId,
    nombre: "Verificación GPS",
    email: "verify.worker@test",
    telefono: "3000000000",
    documento: "999999",
    rol: "mesero",
    estado: "sin_asignar",
    cuentaCreada: true,
    habilitado: true,
  };
  demoStore.workers = [worker];

  const shift: Turno = {
    id: "verify-shift-1",
    workerId,
    workerNombre: worker.nombre,
    siteId: "verify-site",
    siteNombre: "Sitio prueba",
    eventId: "verify-event",
    eventNombre: "Evento prueba",
    inicio: new Date().toISOString(),
    fin: new Date(Date.now() + 8 * 3600_000).toISOString(),
    estado: "confirmado",
  };
  demoStore.shifts = [shift];

  const qr: QrCode = {
    id: "verify-qr-1",
    siteId: "verify-site",
    siteNombre: "Sitio prueba",
    eventId: "verify-event",
    eventNombre: "Evento prueba",
    token: "verifytoken",
    activo: true,
    creadoEn: new Date().toISOString(),
  };
  demoStore.qrCodes = [qr];

  demoStore.accounts = [
    ...demoStore.accounts.filter((a) => a.email !== worker.email),
    {
      email: worker.email!,
      password: "Worker123!",
      user: {
        uid: "verify-uid",
        email: worker.email!,
        nombre: worker.nombre,
        role: "trabajador",
        workerId,
        perfilCompleto: true,
        habilitado: true,
      },
    },
  ];

  demoStore.attendances = [];
  return { worker, qr, shift };
}

function main(): void {
  const { worker, qr, shift } = seedMinimalData();

  const position = { lat: 4.701, lng: -74.072, accuracy: 8 };
  const attId = demoStore.checkIn({
    workerId: worker.id,
    workerNombre: worker.nombre,
    shift,
    siteId: qr.siteId,
    siteNombre: qr.siteNombre,
    eventId: qr.eventId,
    eventNombre: qr.eventNombre,
    qrId: qr.id,
    estado: "activo",
    entrada: {
      timestamp: new Date().toISOString(),
      lat: position.lat,
      lng: position.lng,
      dentroGeocerca: true,
    },
    position,
  });

  const att = demoStore.attendances.find((a) => a.id === attId);
  assert(Boolean(att?.ubicacionActual), "checkIn debe guardar ubicacionActual");
  assert(
    Math.abs(att!.ubicacionActual!.lat - position.lat) < 0.0001,
    "Latitud GPS debe coincidir",
  );

  const activosConGps = demoStore.attendances.filter(
    (a) => a.estado !== "cerrado" && a.ubicacionActual,
  );
  assert(activosConGps.length >= 1, "Admin debe ver jornadas con GPS");

  demoStore.checkOut(attId, position);

  const workerEmail = worker.email!;
  setDemoAccountHabilitado(workerEmail, false);
  let blocked = false;
  try {
    demoLogin(workerEmail, "Worker123!");
  } catch (err) {
    blocked = err instanceof Error && err.message.toLowerCase().includes("inhabilit");
  }
  assert(blocked, "Login debe fallar cuando el usuario está inhabilitado");
  setDemoAccountHabilitado(workerEmail, true);

  setDemoAccountPassword(workerEmail, "NuevaClave99!");
  const loggedIn = demoLogin(workerEmail, "NuevaClave99!");
  assert(loggedIn.email === workerEmail, "Nueva contraseña debe permitir login");
  setDemoAccountPassword(workerEmail, "Worker123!");

  console.log("✓ Flujos demo OK:", {
    gpsEnAsistencia: true,
    loginInhabilitado: true,
    resetPassword: true,
    jornadasConGps: activosConGps.length,
  });
}

main();
