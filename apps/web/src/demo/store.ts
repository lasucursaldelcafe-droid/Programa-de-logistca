import type {
  AppUser,
  Attendance,
  AttendanceEstado,
  Evento,
  GeoRegistro,
  Invitation,
  QrCode,
  Sitio,
  Turno,
  Worker,
} from "@spe/shared";
import type { GeoPosition } from "../lib/geolocation";

export const DEMO_ACCOUNTS: Array<{
  email: string;
  password: string;
  user: AppUser;
}> = [
  {
    email: "admin@eventos.test",
    password: "Admin123!",
    user: {
      uid: "demo-admin",
      email: "admin@eventos.test",
      nombre: "Admin Principal",
      role: "administrador",
      perfilCompleto: true,
    },
  },
  {
    email: "supervisor@eventos.test",
    password: "Super123!",
    user: {
      uid: "demo-super",
      email: "supervisor@eventos.test",
      nombre: "Carlos Supervisor",
      role: "supervisor_sitio",
      perfilCompleto: true,
    },
  },
  {
    email: "maria@eventos.test",
    password: "Trab123!",
    user: {
      uid: "demo-maria",
      email: "maria@eventos.test",
      nombre: "María López",
      role: "trabajador",
      workerId: "worker-maria",
      telefono: "3001112233",
      perfilCompleto: true,
    },
  },
  {
    email: "juan@eventos.test",
    password: "Trab123!",
    user: {
      uid: "demo-juan",
      email: "juan@eventos.test",
      nombre: "Juan Pérez",
      role: "trabajador",
      workerId: "worker-juan",
      telefono: "3109988776",
      perfilCompleto: true,
    },
  },
];

const inicio = new Date();
inicio.setHours(inicio.getHours() + 2);
const fin = new Date(inicio);
fin.setHours(fin.getHours() + 6);

export const INITIAL_WORKERS: Worker[] = [
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

export const INITIAL_EVENTS: Evento[] = [
  {
    id: "event-festival",
    nombre: "Festival Gastronómico 2026",
    fechaInicio: "2026-07-10T08:00:00.000Z",
    fechaFin: "2026-07-12T22:00:00.000Z",
    sitioIds: ["site-cocina", "site-puerta"],
  },
];

export const INITIAL_SITES: Sitio[] = [
  {
    id: "site-cocina",
    eventId: "event-festival",
    nombre: "Cocina central",
    lat: 4.6533,
    lng: -74.0836,
    radioGeocerca: 80,
  },
  {
    id: "site-puerta",
    eventId: "event-festival",
    nombre: "Puerta principal",
    lat: 4.654,
    lng: -74.084,
    radioGeocerca: 50,
  },
];

export const INITIAL_SHIFTS: Turno[] = [
  {
    id: "shift-maria-1",
    workerId: "worker-maria",
    workerNombre: "María López",
    eventId: "event-festival",
    eventNombre: "Festival Gastronómico 2026",
    siteId: "site-cocina",
    siteNombre: "Cocina central",
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    estado: "pendiente",
  },
  {
    id: "shift-juan-1",
    workerId: "worker-juan",
    workerNombre: "Juan Pérez",
    eventId: "event-festival",
    eventNombre: "Festival Gastronómico 2026",
    siteId: "site-puerta",
    siteNombre: "Puerta principal",
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    estado: "confirmado",
  },
];

const ventanaInicio = new Date();
ventanaInicio.setHours(ventanaInicio.getHours() - 1);
const ventanaFin = new Date();
ventanaFin.setHours(ventanaFin.getHours() + 12);

export const INITIAL_QR_CODES: QrCode[] = [
  {
    id: "qr-site-cocina",
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
    creadoPor: "demo-admin",
  },
  {
    id: "qr-site-puerta",
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
    creadoPor: "demo-admin",
  },
];

export const INITIAL_ATTENDANCES: Attendance[] = [
  {
    id: "att-juan-activo",
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
  },
];

const expira = new Date();
expira.setDate(expira.getDate() + 7);

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "inv-ana-demo",
    token: "inv-ana-demo",
    workerId: "worker-ana",
    workerNombre: "Ana Gómez",
    email: "ana@eventos.test",
    estado: "pendiente",
    creadaEn: new Date().toISOString(),
    expiraEn: expira.toISOString(),
    creadaPor: "demo-admin",
    creadaPorNombre: "Admin Principal",
  },
];

type Listener = () => void;

class DemoStore {
  workers = [...INITIAL_WORKERS];
  shifts = [...INITIAL_SHIFTS];
  events = [...INITIAL_EVENTS];
  sites = [...INITIAL_SITES];
  invitations = [...INITIAL_INVITATIONS];
  qrCodes = [...INITIAL_QR_CODES];
  attendances = [...INITIAL_ATTENDANCES];
  accounts = [...DEMO_ACCOUNTS];
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  addWorker(worker: Omit<Worker, "id">): void {
    const id = `worker-${Date.now()}`;
    this.workers = [...this.workers, { ...worker, id }].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
    this.notify();
  }

  updateWorker(id: string, patch: Partial<Worker>): void {
    this.workers = this.workers.map((w) => (w.id === id ? { ...w, ...patch } : w));
    this.notify();
  }

  addShift(shift: Omit<Turno, "id">): void {
    const id = `shift-${Date.now()}`;
    this.shifts = [...this.shifts, { ...shift, id }].sort((a, b) =>
      a.inicio.localeCompare(b.inicio),
    );
    this.notify();
  }

  updateShift(id: string, patch: Partial<Turno>): void {
    this.shifts = this.shifts.map((s) => (s.id === id ? { ...s, ...patch } : s));
    this.notify();
  }

  getInvitation(token: string): Invitation | null {
    return this.invitations.find((i) => i.token === token) ?? null;
  }

  addInvitation(invitation: Invitation): void {
    this.invitations = [invitation, ...this.invitations];
    this.notify();
  }

  updateInvitation(token: string, patch: Partial<Invitation>): void {
    this.invitations = this.invitations.map((i) =>
      i.token === token ? { ...i, ...patch } : i,
    );
    this.notify();
  }

  activateAccount(token: string, password: string): void {
    const invitation = this.getInvitation(token);
    if (!invitation) throw new Error("Invitación no encontrada");
    if (invitation.estado !== "pendiente") throw new Error("Esta invitación ya no está disponible");
    if (new Date(invitation.expiraEn) < new Date()) throw new Error("La invitación ha expirado");

    const worker = this.workers.find((w) => w.id === invitation.workerId);
    if (!worker) throw new Error("Trabajador no encontrado");
    if (worker.cuentaCreada) throw new Error("Este trabajador ya tiene cuenta activa");

    const uid = `demo-${invitation.workerId}`;
    const appUser: AppUser = {
      uid,
      email: invitation.email,
      nombre: invitation.workerNombre,
      role: "trabajador",
      workerId: invitation.workerId,
      perfilCompleto: false,
    };

    this.accounts = [
      ...this.accounts,
      { email: invitation.email, password, user: appUser },
    ];
    this.updateWorker(invitation.workerId, { cuentaCreada: true });
    this.updateInvitation(token, {
      estado: "usada",
      usadaEn: new Date().toISOString(),
      uid,
    });
    saveDemoSession(invitation.email);
  }

  completeProfile(uid: string, data: { nombre: string; telefono: string }): void {
    this.accounts = this.accounts.map((a) =>
      a.user.uid === uid
        ? {
            ...a,
            user: {
              ...a.user,
              nombre: data.nombre,
              telefono: data.telefono,
              perfilCompleto: true,
            },
          }
        : a,
    );
    const account = this.accounts.find((a) => a.user.uid === uid);
    if (account?.user.workerId) {
      this.updateWorker(account.user.workerId, { telefono: data.telefono, nombre: data.nombre });
    }
    this.notify();
  }

  findAccountByEmail(email: string) {
    return this.accounts.find((a) => a.email === email);
  }

  addQrCode(qr: QrCode): void {
    this.qrCodes = [qr, ...this.qrCodes];
    this.notify();
  }

  updateQrCode(id: string, patch: Partial<QrCode>): void {
    this.qrCodes = this.qrCodes.map((q) => (q.id === id ? { ...q, ...patch } : q));
    this.notify();
  }

  checkIn(data: {
    workerId: string;
    workerNombre: string;
    shift: Turno;
    qr: QrCode;
    estado: AttendanceEstado;
    entrada: GeoRegistro;
    position: GeoPosition;
  }): string {
    const existing = this.attendances.find(
      (a) => a.workerId === data.workerId && a.estado !== "cerrado",
    );
    if (existing) throw new Error("Ya tienes una jornada activa");

    const id = `att-${Date.now()}`;
    this.attendances = [
      {
        id,
        workerId: data.workerId,
        workerNombre: data.workerNombre,
        shiftId: data.shift.id,
        siteId: data.qr.siteId,
        siteNombre: data.qr.siteNombre,
        eventId: data.qr.eventId,
        eventNombre: data.qr.eventNombre,
        qrId: data.qr.id,
        estado: data.estado,
        entrada: data.entrada,
        ubicacionActual: { lat: data.position.lat, lng: data.position.lng },
        alertasGeocerca: [],
        creadoEn: new Date().toISOString(),
      },
      ...this.attendances,
    ];
    this.updateWorker(data.workerId, { estado: "en_sitio" });
    this.notify();
    return id;
  }

  checkOut(attendanceId: string, position: GeoPosition): void {
    const att = this.attendances.find((a) => a.id === attendanceId);
    if (!att) throw new Error("Jornada no encontrada");
    const site = this.sites.find((s) => s.id === att.siteId);
    const dentro = site
      ? Math.hypot(position.lat - site.lat, position.lng - site.lng) < 0.001
      : true;

    this.attendances = this.attendances.map((a) =>
      a.id === attendanceId
        ? {
            ...a,
            estado: "cerrado",
            salida: {
              timestamp: new Date().toISOString(),
              lat: position.lat,
              lng: position.lng,
              dentroGeocerca: dentro,
            },
          }
        : a,
    );
    this.updateWorker(att.workerId, { estado: "sin_asignar" });
    this.notify();
  }

  updateAttendanceLocation(
    attendanceId: string,
    position: GeoPosition,
    dentroGeocerca: boolean,
  ): void {
    this.attendances = this.attendances.map((a) =>
      a.id === attendanceId
        ? {
            ...a,
            ubicacionActual: { lat: position.lat, lng: position.lng },
            estado: dentroGeocerca ? "activo" : "fuera_geocerca",
          }
        : a,
    );
    this.notify();
  }

  recordGeofenceAlert(attendanceId: string): void {
    const now = new Date().toISOString();
    this.attendances = this.attendances.map((a) =>
      a.id === attendanceId
        ? {
            ...a,
            estado: "fuera_geocerca",
            alertasGeocerca: [...a.alertasGeocerca, now],
          }
        : a,
    );
    this.notify();
  }
}

export const demoStore = new DemoStore();

const SESSION_KEY = "spe-demo-user";

export function loadDemoSession(): AppUser | null {
  const email = sessionStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return demoStore.accounts.find((a) => a.email === email)?.user ?? null;
}

export function saveDemoSession(email: string): void {
  sessionStorage.setItem(SESSION_KEY, email);
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function demoLogin(email: string, password: string): AppUser {
  const account = demoStore.accounts.find((a) => a.email === email && a.password === password);
  if (!account) throw new Error("Credenciales inválidas");
  saveDemoSession(email);
  return account.user;
}
