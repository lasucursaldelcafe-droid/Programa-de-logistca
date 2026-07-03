/**
 * Seed de datos de prueba para Firebase Emulators (Fase 1).
 * Requiere emulators corriendo: npm run emulators
 */
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

const PROJECT_ID = "demo-personal-eventos";

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const auth = getAuth();
const db = getFirestore();

interface SeedUser {
  email: string;
  password: string;
  nombre: string;
  role: "super_admin" | "administrador" | "supervisor_sitio" | "trabajador";
  workerId?: string;
}

const USERS: SeedUser[] = [
  { email: "admin@eventos.test", password: "Admin123!", nombre: "Admin Principal", role: "administrador" },
  { email: "supervisor@eventos.test", password: "Super123!", nombre: "Carlos Supervisor", role: "supervisor_sitio" },
  { email: "maria@eventos.test", password: "Trab123!", nombre: "María López", role: "trabajador", workerId: "worker-maria" },
  { email: "juan@eventos.test", password: "Trab123!", nombre: "Juan Pérez", role: "trabajador", workerId: "worker-juan" },
];

async function upsertAuthUser(u: SeedUser): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(u.email);
    await auth.updateUser(existing.uid, { password: u.password, displayName: u.nombre });
    return existing.uid;
  } catch {
    const created = await auth.createUser({
      email: u.email,
      password: u.password,
      displayName: u.nombre,
    });
    return created.uid;
  }
}

async function main(): Promise<void> {
  console.log("> Seed Fase 1 — Firebase Emulators");

  const uids: Record<string, string> = {};
  for (const u of USERS) {
    const uid = await upsertAuthUser(u);
    uids[u.email] = uid;
    await db.collection("users").doc(uid).set({
      email: u.email,
      nombre: u.nombre,
      role: u.role,
      workerId: u.workerId ?? null,
      perfilCompleto: true,
    });
    console.log(`+ usuario ${u.email} (${u.role})`);
  }

  const workers = [
    {
      id: "worker-maria",
      nombre: "María López",
      documento: "1020304050",
      telefono: "3001112233",
      email: "maria@eventos.test",
      perfiles: ["logistica", "montaje"],
      experienciaAnios: 3,
      eventosTrabajados: 28,
      rating: 4.7,
      estado: "sin_asignar",
      cuentaCreada: true,
      certificaciones: [],
      creadoEn: new Date().toISOString(),
    },
    {
      id: "worker-juan",
      nombre: "Juan Pérez",
      documento: "80123456",
      telefono: "3109988776",
      email: "juan@eventos.test",
      perfiles: ["recreacion", "anfitrion"],
      experienciaAnios: 5,
      eventosTrabajados: 41,
      rating: 4.9,
      estado: "en_sitio",
      cuentaCreada: true,
      certificaciones: ["primeros_auxilios"],
      creadoEn: new Date().toISOString(),
    },
    {
      id: "worker-ana",
      nombre: "Ana Gómez",
      documento: "52987654",
      telefono: "3205544332",
      email: "ana@eventos.test",
      perfiles: ["chef", "logistica"],
      experienciaAnios: 8,
      eventosTrabajados: 67,
      rating: 4.8,
      estado: "descanso",
      cuentaCreada: false,
      certificaciones: ["manipulacion_alimentos"],
      creadoEn: new Date().toISOString(),
    },
  ];

  for (const w of workers) {
    const { id, ...data } = w;
    await db.collection("workers").doc(id).set(data);
    console.log(`+ trabajador ${w.nombre}`);
  }

  await db.collection("events").doc("event-festival").set({
    nombre: "Festival Gastronómico 2026",
    fechaInicio: "2026-07-10T08:00:00.000Z",
    fechaFin: "2026-07-12T22:00:00.000Z",
    sitioIds: ["site-cocina", "site-puerta"],
  });

  await db.collection("sites").doc("site-cocina").set({
    eventId: "event-festival",
    nombre: "Cocina central",
    lat: 4.6533,
    lng: -74.0836,
    radioGeocerca: 80,
  });

  await db.collection("sites").doc("site-puerta").set({
    eventId: "event-festival",
    nombre: "Puerta principal",
    lat: 4.654,
    lng: -74.084,
    radioGeocerca: 50,
  });

  const inicio = new Date();
  inicio.setHours(inicio.getHours() + 2);
  const fin = new Date(inicio);
  fin.setHours(fin.getHours() + 6);

  await db.collection("shifts").doc("shift-maria-1").set({
    workerId: "worker-maria",
    workerNombre: "María López",
    eventId: "event-festival",
    eventNombre: "Festival Gastronómico 2026",
    siteId: "site-cocina",
    siteNombre: "Cocina central",
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    estado: "pendiente",
  });

  await db.collection("shifts").doc("shift-juan-1").set({
    workerId: "worker-juan",
    workerNombre: "Juan Pérez",
    eventId: "event-festival",
    eventNombre: "Festival Gastronómico 2026",
    siteId: "site-puerta",
    siteNombre: "Puerta principal",
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    estado: "confirmado",
  });

  console.log("+ evento, sitios y turnos de ejemplo");

  const expira = new Date();
  expira.setDate(expira.getDate() + 7);

  await db.collection("invitations").doc("inv-ana-demo").set({
    workerId: "worker-ana",
    workerNombre: "Ana Gómez",
    email: "ana@eventos.test",
    estado: "pendiente",
    creadaEn: new Date().toISOString(),
    expiraEn: expira.toISOString(),
    creadaPor: uids["admin@eventos.test"] ?? "seed",
    creadaPorNombre: "Admin Principal",
  });
  console.log("+ invitación demo para Ana Gómez (token: inv-ana-demo)");

  const ventanaInicio = new Date();
  ventanaInicio.setHours(ventanaInicio.getHours() - 1);
  const ventanaFin = new Date();
  ventanaFin.setHours(ventanaFin.getHours() + 12);

  await db.collection("qrCodes").doc("qr-site-cocina").set({
    eventId: "event-festival",
    eventNombre: "Festival Gastronómico 2026",
    siteId: "site-cocina",
    siteNombre: "Cocina central",
    token: "cocina2026token",
    modo: "por_jornada",
    ventanaInicio: ventanaInicio.toISOString(),
    ventanaFin: ventanaFin.toISOString(),
    radioGeocerca: 80,
    descripcionDatos:
      "Recopilamos tu ubicación GPS solo durante la jornada activa para verificar presencia en el sitio asignado.",
    activo: true,
    creadoEn: new Date().toISOString(),
    creadoPor: uids["admin@eventos.test"] ?? "seed",
  });

  await db.collection("qrCodes").doc("qr-site-puerta").set({
    eventId: "event-festival",
    eventNombre: "Festival Gastronómico 2026",
    siteId: "site-puerta",
    siteNombre: "Puerta principal",
    token: "puerta2026token",
    modo: "por_jornada",
    ventanaInicio: ventanaInicio.toISOString(),
    ventanaFin: ventanaFin.toISOString(),
    radioGeocerca: 50,
    descripcionDatos:
      "Recopilamos tu ubicación GPS solo durante la jornada activa para verificar presencia en el sitio asignado.",
    activo: true,
    creadoEn: new Date().toISOString(),
    creadoPor: uids["admin@eventos.test"] ?? "seed",
  });
  console.log("+ códigos QR de sitio (cocina, puerta)");

  await db.collection("attendance").doc("att-juan-activo").set({
    workerId: "worker-juan",
    workerNombre: "Juan Pérez",
    shiftId: "shift-juan-1",
    siteId: "site-puerta",
    siteNombre: "Puerta principal",
    eventId: "event-festival",
    eventNombre: "Festival Gastronómico 2026",
    qrId: "qr-site-puerta",
    estado: "activo",
    entrada: {
      timestamp: new Date().toISOString(),
      lat: 4.654,
      lng: -74.084,
      dentroGeocerca: true,
    },
    ubicacionActual: { lat: 4.654, lng: -74.084 },
    alertasGeocerca: [],
    creadoEn: new Date().toISOString(),
  });
  console.log("+ jornada activa demo (Juan Pérez)");

  console.log("\n✓ Seed completo. Cuentas:");
  for (const u of USERS) {
    console.log(`  ${u.email} / ${u.password}`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
