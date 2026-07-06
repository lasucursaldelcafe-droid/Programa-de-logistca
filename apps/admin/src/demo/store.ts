import type {
  AppUser,
  AppNotification,
  Attendance,
  AttendanceEstado,
  BreakSchedule,
  CredencialesIntegracion,
  Evento,
  GeoRegistro,
  Invitation,
  PayrollAuditEntry,
  PayrollEntry,
  PayrollRate,
  QrCode,
  Reporte,
  SetupConfig,
  Sitio,
  TipoIntegracion,
  Turno,
  Worker,
} from "@spe/shared";
import type { GeoPosition } from "../lib/geolocation";
import {
  INITIAL_CLIENTES,
  INITIAL_FACTURAS,
  INITIAL_POSICIONES,
  INITIAL_PRODUCTOS,
} from "./business";
import {
  loadCredencialesFromStorage,
  saveCredencialesToStorage,
} from "./integrations";

export const DEMO_ACCOUNTS: Array<{
  email: string;
  password: string;
  user: AppUser;
}> = [
  {
    email: "master@eventos.test",
    password: "Master123!",
    user: {
      uid: "demo-master",
      email: "master@eventos.test",
      nombre: "Master Plataforma",
      role: "super_admin",
      perfilCompleto: true,
    },
  },
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
];

export const INITIAL_WORKERS: Worker[] = [];

export const INITIAL_EVENTS: Evento[] = [];

export const INITIAL_SITES: Sitio[] = [];

export const INITIAL_SHIFTS: Turno[] = [];

export const INITIAL_QR_CODES: QrCode[] = [];

export const INITIAL_ATTENDANCES: Attendance[] = [];

export const INITIAL_PAYROLL_RATES: PayrollRate[] = [];

export const INITIAL_PAYROLL_ENTRIES: PayrollEntry[] = [];

export const INITIAL_PAYROLL_AUDIT: PayrollAuditEntry[] = [];

export const INITIAL_SETUP_CONFIG: SetupConfig = {
  id: "default",
  completado: false,
  pasoActual: "evento",
  pasosCompletados: [],
  actualizadoEn: new Date().toISOString(),
  actualizadoPor: "demo-admin",
  actualizadoPorNombre: "Admin Principal",
};

export const INITIAL_NOTIFICATIONS: Omit<AppNotification, "id">[] = [];

export const INITIAL_INVITATIONS: Invitation[] = [];

export const INITIAL_REPORTES: Reporte[] = [];

type Listener = () => void;

class DemoStore {
  workers = [...INITIAL_WORKERS];
  shifts = [...INITIAL_SHIFTS];
  events = [...INITIAL_EVENTS];
  sites = [...INITIAL_SITES];
  invitations = [...INITIAL_INVITATIONS];
  qrCodes = [...INITIAL_QR_CODES];
  attendances = [...INITIAL_ATTENDANCES];
  notifications: AppNotification[] = INITIAL_NOTIFICATIONS.map((n, i) => ({
    ...n,
    id: `notif-${i}`,
  }));
  breaks: BreakSchedule[] = [];
  payrollRates = [...INITIAL_PAYROLL_RATES];
  payrollEntries = [...INITIAL_PAYROLL_ENTRIES];
  payrollAudit = [...INITIAL_PAYROLL_AUDIT];
  setupConfig: SetupConfig | null = { ...INITIAL_SETUP_CONFIG };
  reportes = [...INITIAL_REPORTES];
  clientes = [...INITIAL_CLIENTES];
  productos = [...INITIAL_PRODUCTOS];
  facturas = [...INITIAL_FACTURAS];
  posiciones = [...INITIAL_POSICIONES];
  credencialesIntegraciones = loadCredencialesFromStorage();
  accounts = [...DEMO_ACCOUNTS];
  platformUsers: AppUser[] = DEMO_ACCOUNTS.map((a) => a.user);
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.platformUsers = this.accounts.map((a) => a.user);
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

  addShift(shift: Omit<Turno, "id">): string {
    const id = `shift-${Date.now()}`;
    this.shifts = [...this.shifts, { ...shift, id }].sort((a, b) =>
      a.inicio.localeCompare(b.inicio),
    );
    this.notify();
    return id;
  }

  updateShift(id: string, patch: Partial<Turno>): void {
    this.shifts = this.shifts.map((s) => (s.id === id ? { ...s, ...patch } : s));
    this.notify();
  }

  getInvitation(token: string): Invitation | null {
    return this.invitations.find((i) => i.token === token) ?? null;
  }

  findInvitationByEmailAndCode(email: string, codigoAcceso: string): Invitation | null {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = codigoAcceso.replace(/\s/g, "").trim();
    return (
      this.invitations.find(
        (i) =>
          i.email.trim().toLowerCase() === normalizedEmail &&
          i.codigoAcceso === normalizedCode &&
          i.estado === "pendiente",
      ) ?? null
    );
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

  activateAccount(token: string, password: string, codigoAcceso: string): void {
    const invitation = this.getInvitation(token);
    if (!invitation) throw new Error("Invitación no encontrada");
    if (invitation.estado !== "pendiente") throw new Error("Esta invitación ya no está disponible");
    if (new Date(invitation.expiraEn) < new Date()) throw new Error("La invitación ha expirado");
    if (invitation.codigoAcceso !== codigoAcceso.replace(/\s/g, "").trim()) {
      throw new Error("Código de invitación incorrecto");
    }

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

  addNotification(data: Omit<AppNotification, "id">): void {
    const id = `notif-${Date.now()}`;
    this.notifications = [{ ...data, id }, ...this.notifications];
    this.notify();
  }

  markNotificationRead(notificationId: string, uid: string): void {
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId && !n.leidaPor.includes(uid)
        ? { ...n, leidaPor: [...n.leidaPor, uid] }
        : n,
    );
    this.notify();
  }

  addBreak(data: Omit<BreakSchedule, "id" | "notificado"> & { notificado?: boolean }): void {
    const id = `break-${Date.now()}`;
    this.breaks = [...this.breaks, { ...data, id, notificado: data.notificado ?? false }];
    this.notify();
  }

  markBreakNotified(breakId: string): void {
    this.breaks = this.breaks.map((b) =>
      b.id === breakId ? { ...b, notificado: true } : b,
    );
    this.notify();
  }

  upsertPayrollRate(rate: PayrollRate): void {
    const exists = this.payrollRates.some((r) => r.id === rate.id);
    this.payrollRates = exists
      ? this.payrollRates.map((r) => (r.id === rate.id ? rate : r))
      : [...this.payrollRates, rate].sort((a, b) => a.perfil.localeCompare(b.perfil));
    this.notify();
  }

  addPayrollEntry(entry: Omit<PayrollEntry, "id">): string {
    const id = `pay-${Date.now()}`;
    this.payrollEntries = [{ ...entry, id }, ...this.payrollEntries];
    this.notify();
    return id;
  }

  updatePayrollEntry(id: string, patch: Partial<PayrollEntry>): void {
    this.payrollEntries = this.payrollEntries.map((e) =>
      e.id === id ? { ...e, ...patch } : e,
    );
    this.notify();
  }

  addPayrollAudit(entry: Omit<PayrollAuditEntry, "id">): void {
    const id = `audit-${Date.now()}`;
    this.payrollAudit = [{ ...entry, id }, ...this.payrollAudit];
    this.notify();
  }

  addEvent(event: Evento): void {
    this.events = [...this.events, event];
    this.notify();
  }

  addSite(site: Sitio): void {
    this.sites = [...this.sites, site];
    this.events = this.events.map((e) =>
      e.id === site.eventId && !e.sitioIds.includes(site.id)
        ? { ...e, sitioIds: [...e.sitioIds, site.id] }
        : e,
    );
    this.notify();
  }

  setSetupConfig(config: SetupConfig): void {
    this.setupConfig = config;
    this.notify();
  }

  updateSetupConfig(patch: Partial<SetupConfig>): void {
    if (!this.setupConfig) return;
    this.setupConfig = { ...this.setupConfig, ...patch };
    this.notify();
  }

  addReporte(reporte: Reporte): void {
    this.reportes = [reporte, ...this.reportes];
    this.notify();
  }

  updateReporte(id: string, patch: Partial<Reporte>): void {
    this.reportes = this.reportes.map((r) => (r.id === id ? { ...r, ...patch } : r));
    this.notify();
  }

  tickPosiciones(): void {
    this.posiciones = this.posiciones.map((p) => ({
      ...p,
      lat: p.lat + (Math.random() - 0.5) * 0.0002,
      lng: p.lng + (Math.random() - 0.5) * 0.0002,
      actualizadoEn: new Date().toISOString(),
    }));
    this.notify();
  }

  getCredenciales(id: TipoIntegracion): CredencialesIntegracion {
    return this.credencialesIntegraciones[id];
  }

  saveCredenciales(creds: CredencialesIntegracion): void {
    this.credencialesIntegraciones = {
      ...this.credencialesIntegraciones,
      [creds.id]: { ...creds, actualizadoEn: new Date().toISOString() },
    };
    saveCredencialesToStorage(this.credencialesIntegraciones);
    this.notify();
  }

  clearCredenciales(id: TipoIntegracion): void {
    this.credencialesIntegraciones = {
      ...this.credencialesIntegraciones,
      [id]: { id },
    };
    saveCredencialesToStorage(this.credencialesIntegraciones);
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
