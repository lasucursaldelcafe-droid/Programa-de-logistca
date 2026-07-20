import type {
  AppUser,
  AppNotification,
  Attendance,
  AttendanceEstado,
  BreakSchedule,
  ChatConversation,
  Cliente,
  ConversationMessage,
  CredencialesIntegracion,
  CustomRole,
  Evento,
  GeoRegistro,
  Invitation,
  PayrollAuditEntry,
  PayrollEntry,
  PayrollRate,
  Producto,
  QrCode,
  Reporte,
  SetupConfig,
  Sitio,
  TipoIntegracion,
  Turno,
  VideoRoom,
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
import { loadDemoPersistedState, saveDemoPersistedState } from "./persist";
import { appendChangeLog, type DemoChangeAction, type DemoChangeEntry } from "./changeLog";
import { isDemoEntityId, isDemoEvent } from "./demoPurge";

export const DEMO_ACCOUNTS: Array<{
  email: string;
  password: string;
  user: AppUser;
}> = [];

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
  conversations: ChatConversation[] = [];
  messages: ConversationMessage[] = [];
  videoRooms: VideoRoom[] = [];
  customRoles: CustomRole[] = [];
  clientes = [...INITIAL_CLIENTES];
  productos = [...INITIAL_PRODUCTOS];
  facturas = [...INITIAL_FACTURAS];
  posiciones = [...INITIAL_POSICIONES];
  credencialesIntegraciones = loadCredencialesFromStorage();
  accounts = [...DEMO_ACCOUNTS];
  platformUsers: AppUser[] = DEMO_ACCOUNTS.map((a) => a.user);
  changeLog: DemoChangeEntry[] = [];
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.platformUsers = this.accounts.map((a) => a.user);
    saveDemoPersistedState({
      workers: this.workers,
      shifts: this.shifts,
      events: this.events,
      sites: this.sites,
      invitations: this.invitations,
      qrCodes: this.qrCodes,
      attendances: this.attendances,
      notifications: this.notifications,
      breaks: this.breaks,
      payrollRates: this.payrollRates,
      payrollEntries: this.payrollEntries,
      payrollAudit: this.payrollAudit,
      setupConfig: this.setupConfig,
      reportes: this.reportes,
      conversations: this.conversations,
      messages: this.messages,
      videoRooms: this.videoRooms,
      customRoles: this.customRoles,
      clientes: this.clientes,
      productos: this.productos,
      facturas: this.facturas,
      posiciones: this.posiciones,
      credencialesIntegraciones: this.credencialesIntegraciones,
      accounts: this.accounts,
      changeLog: this.changeLog,
    });
    for (const listener of this.listeners) listener();
  }

  hydrateFromStorage(): void {
    const saved = loadDemoPersistedState();
    if (!saved) return;

    if (saved.workers) this.workers = saved.workers;
    if (saved.shifts) this.shifts = saved.shifts;
    if (saved.events) this.events = saved.events;
    if (saved.sites) this.sites = saved.sites;
    if (saved.invitations) this.invitations = saved.invitations;
    if (saved.qrCodes) this.qrCodes = saved.qrCodes;
    if (saved.attendances) this.attendances = saved.attendances;
    if (saved.notifications) this.notifications = saved.notifications;
    if (saved.breaks) this.breaks = saved.breaks;
    if (saved.payrollRates) this.payrollRates = saved.payrollRates;
    if (saved.payrollEntries) this.payrollEntries = saved.payrollEntries;
    if (saved.payrollAudit) this.payrollAudit = saved.payrollAudit;
    if (saved.setupConfig !== undefined) this.setupConfig = saved.setupConfig;
    if (saved.reportes) this.reportes = saved.reportes;
    if (saved.conversations) this.conversations = saved.conversations;
    if (saved.messages) this.messages = saved.messages;
    if (saved.videoRooms) this.videoRooms = saved.videoRooms;
    if (saved.customRoles) this.customRoles = saved.customRoles;
    if (saved.clientes) this.clientes = saved.clientes;
    if (saved.productos) this.productos = saved.productos;
    if (saved.facturas) this.facturas = saved.facturas;
    if (saved.posiciones) this.posiciones = saved.posiciones;
    if (saved.credencialesIntegraciones) {
      this.credencialesIntegraciones = saved.credencialesIntegraciones;
    }

    const platformEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email));
    const workerAccounts = (saved.accounts ?? []).filter((a) => !platformEmails.has(a.email));
    this.accounts = [...DEMO_ACCOUNTS, ...workerAccounts];
    this.platformUsers = this.accounts.map((a) => a.user);
    if (saved.changeLog) this.changeLog = saved.changeLog;
  }

  /** Elimina eventos de prueba y datos relacionados persistidos en localStorage. */
  purgeDemoEvents(): void {
    const demoEventIds = new Set(
      this.events.filter(isDemoEvent).map((event) => event.id),
    );
    if (demoEventIds.size === 0 && !this.hasDemoEntityData()) return;

    this.events = this.events.filter((event) => !isDemoEvent(event));

    this.sites = this.sites.filter(
      (site) =>
        !demoEventIds.has(site.eventId) && !isDemoEntityId(site.id),
    );

    this.shifts = this.shifts.filter(
      (shift) =>
        !demoEventIds.has(shift.eventId) && !isDemoEntityId(shift.id),
    );

    this.attendances = this.attendances.filter(
      (attendance) =>
        !demoEventIds.has(attendance.eventId) && !isDemoEntityId(attendance.id),
    );

    this.qrCodes = this.qrCodes.filter(
      (qr) => !demoEventIds.has(qr.eventId) && !isDemoEntityId(qr.id),
    );

    this.workers = this.workers.filter((worker) => !isDemoEntityId(worker.id));

    this.notify();
  }

  private hasDemoEntityData(): boolean {
    return (
      this.events.some(isDemoEvent) ||
      this.sites.some((site) => isDemoEntityId(site.id)) ||
      this.shifts.some((shift) => isDemoEntityId(shift.id)) ||
      this.attendances.some((attendance) => isDemoEntityId(attendance.id)) ||
      this.qrCodes.some((qr) => isDemoEntityId(qr.id)) ||
      this.workers.some((worker) => isDemoEntityId(worker.id))
    );
  }

  private recordChange(
    action: DemoChangeAction,
    targetId: string,
    opts?: { targetLabel?: string; actorNombre?: string; detail?: string },
  ): void {
    this.changeLog = appendChangeLog(this.changeLog, {
      action,
      targetId,
      targetLabel: opts?.targetLabel,
      actorNombre: opts?.actorNombre,
      detail: opts?.detail,
    });
  }

  addWorker(worker: Omit<Worker, "id">, actorNombre?: string): string {
    const id = `worker-${Date.now()}`;
    this.workers = [...this.workers, { ...worker, id }].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
    this.recordChange("worker.create", id, {
      targetLabel: worker.nombre,
      actorNombre,
    });
    this.notify();
    return id;
  }

  updateWorker(id: string, patch: Partial<Worker>, actorNombre?: string): void {
    const prev = this.workers.find((w) => w.id === id);
    this.workers = this.workers.map((w) => (w.id === id ? { ...w, ...patch } : w));
    if (prev && Object.keys(patch).length > 0) {
      this.recordChange("worker.update", id, {
        targetLabel: prev.nombre,
        actorNombre,
        detail: Object.keys(patch).join(", "),
      });
    }
    this.notify();
  }

  removeWorker(id: string, actorNombre?: string): void {
    const worker = this.workers.find((w) => w.id === id);
    if (!worker) return;

    const jornadaActiva = this.attendances.some(
      (a) => a.workerId === id && a.estado !== "cerrado",
    );
    if (jornadaActiva) {
      throw new Error("No se puede eliminar: tiene una jornada activa. Cierra la jornada primero.");
    }

    const platformEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email));

    this.workers = this.workers.filter((w) => w.id !== id);
    this.invitations = this.invitations.filter((i) => i.workerId !== id);
    this.shifts = this.shifts.filter((s) => s.workerId !== id);
    this.accounts = this.accounts.filter(
      (a) => platformEmails.has(a.email) || a.user.workerId !== id,
    );

    this.recordChange("worker.delete", id, {
      targetLabel: worker.nombre,
      actorNombre,
    });
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

  removeShift(id: string): void {
    this.shifts = this.shifts.filter((s) => s.id !== id);
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

  addCustomRole(role: CustomRole): void {
    this.customRoles = [role, ...this.customRoles];
    this.notify();
  }

  updateCustomRole(id: string, patch: Partial<CustomRole>): void {
    this.customRoles = this.customRoles.map((r) => (r.id === id ? { ...r, ...patch } : r));
    this.notify();
  }

  deleteCustomRole(id: string): void {
    this.customRoles = this.customRoles.filter((r) => r.id !== id);
    this.notify();
  }

  provisionWorkerAccount(workerId: string, actorNombre?: string): void {
    const worker = this.workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Trabajador no encontrado");
    if (worker.cuentaCreada) return;

    const email = worker.email.trim().toLowerCase();
    if (this.accounts.some((a) => a.email === email)) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }

    const password = worker.documento.replace(/[\s.\-]/g, "").trim();
    if (password.length < 6) {
      throw new Error("El documento debe tener al menos 6 caracteres para usarlo como contraseña.");
    }

    const assignedRole = worker.rolPlataforma ?? "trabajador";
    const uid = `demo-${workerId}`;
    const appUser: AppUser = {
      uid,
      email,
      nombre: worker.nombre,
      role: assignedRole,
      workerId,
      customRoleId: worker.customRoleId,
      perfilCompleto: assignedRole === "supervisor_sitio",
      habilitado: worker.habilitado !== false,
    };

    this.accounts = [...this.accounts, { email, password, user: appUser }];
    this.updateWorker(workerId, { cuentaCreada: true }, actorNombre);
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
    const assignedRole = invitation.role ?? "trabajador";
    const appUser: AppUser = {
      uid,
      email: invitation.email,
      nombre: invitation.workerNombre,
      role: assignedRole,
      workerId: invitation.workerId,
      customRoleId: invitation.customRoleId,
      perfilCompleto: assignedRole === "supervisor_sitio",
      habilitado: true,
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

  updateEvent(eventId: string, patch: Partial<Evento>): void {
    this.events = this.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e));
    this.notify();
  }

  addConversation(conv: ChatConversation): void {
    const exists = this.conversations.some((c) => c.id === conv.id);
    this.conversations = exists
      ? this.conversations.map((c) => (c.id === conv.id ? conv : c))
      : [conv, ...this.conversations];
    this.notify();
  }

  addMessage(msg: Omit<ConversationMessage, "id">): void {
    const id = `msg-${Date.now()}`;
    this.messages = [...this.messages, { ...msg, id }];
    this.conversations = this.conversations.map((c) =>
      c.id === msg.conversationId
        ? {
            ...c,
            lastMessageAt: msg.creadoEn,
            lastMessagePreview: msg.texto.slice(0, 80),
          }
        : c,
    );
    this.notify();
  }

  getMessages(conversationId: string): ConversationMessage[] {
    return this.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  }

  addVideoRoom(room: VideoRoom): void {
    this.videoRooms = [room, ...this.videoRooms];
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

  addCliente(data: Omit<Cliente, "id" | "creadoEn">): string {
    const id = `cli-${Date.now()}`;
    this.clientes = [
      ...this.clientes,
      { ...data, id, creadoEn: new Date().toISOString() },
    ].sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.notify();
    return id;
  }

  removeCliente(id: string): void {
    this.clientes = this.clientes.filter((c) => c.id !== id);
    this.notify();
  }

  addProducto(data: Omit<Producto, "id">): string {
    const id = `prod-${Date.now()}`;
    this.productos = [
      ...this.productos,
      { ...data, id },
    ].sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.notify();
    return id;
  }

  removeProducto(id: string): void {
    this.productos = this.productos.filter((p) => p.id !== id);
    this.notify();
  }

  setAccountPassword(email: string, newPassword: string): void {
    this.accounts = this.accounts.map((a) =>
      a.email === email ? { ...a, password: newPassword } : a,
    );
    this.notify();
  }

  setAccountHabilitado(email: string, habilitado: boolean): void {
    this.accounts = this.accounts.map((a) =>
      a.email === email
        ? { ...a, user: { ...a.user, habilitado } }
        : a,
    );
    const account = this.accounts.find((a) => a.email === email);
    if (account?.user.workerId) {
      this.updateWorker(account.user.workerId, { habilitado });
    }
    this.notify();
  }
}

export const demoStore = new DemoStore();
demoStore.hydrateFromStorage();
demoStore.purgeDemoEvents();

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
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const account = demoStore.accounts.find(
    (a) => a.email.trim().toLowerCase() === normalizedEmail && a.password === normalizedPassword,
  );
  if (!account) throw new Error("Credenciales inválidas. Prueba admin@eventos.test / Admin123!");

  if (account.user.habilitado === false) {
    throw new Error("Cuenta inhabilitada. Contacta al administrador.");
  }

  if (account.user.workerId) {
    const worker = demoStore.workers.find((w) => w.id === account.user.workerId);
    if (worker && worker.habilitado === false) {
      throw new Error("Tu acceso fue inhabilitado por el administrador.");
    }
    if (worker && worker.estado === "inactivo") {
      throw new Error("Tu perfil está inactivo. Contacta al administrador.");
    }
  }

  saveDemoSession(email);
  demoStore.purgeDemoEvents();
  return account.user;
}

export function setDemoAccountPassword(email: string, newPassword: string): void {
  demoStore.setAccountPassword(email, newPassword);
}

export function setDemoAccountHabilitado(email: string, habilitado: boolean): void {
  demoStore.setAccountHabilitado(email, habilitado);
}
