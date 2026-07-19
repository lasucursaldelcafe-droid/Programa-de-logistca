import type {
  AppNotification,
  AppUser,
  Attendance,
  BreakSchedule,
  Cliente,
  CredencialesIntegracion,
  Evento,
  Factura,
  Invitation,
  PayrollAuditEntry,
  PayrollEntry,
  PayrollRate,
  PosicionTrabajador,
  Producto,
  QrCode,
  Reporte,
  SetupConfig,
  Sitio,
  TipoIntegracion,
  Turno,
  ChatConversation,
  ChatMessage,
  VideoRoom,
  Worker,
} from "@spe/shared";

import type { DemoChangeEntry } from "./changeLog";

const STORAGE_KEY = "spe-demo-store-v1";

export interface DemoPersistedAccount {
  email: string;
  password: string;
  user: AppUser;
}

export interface DemoPersistedState {
  workers: Worker[];
  shifts: Turno[];
  events: Evento[];
  sites: Sitio[];
  invitations: Invitation[];
  qrCodes: QrCode[];
  attendances: Attendance[];
  notifications: AppNotification[];
  breaks: BreakSchedule[];
  payrollRates: PayrollRate[];
  payrollEntries: PayrollEntry[];
  payrollAudit: PayrollAuditEntry[];
  setupConfig: SetupConfig | null;
  reportes: Reporte[];
  conversations: ChatConversation[];
  messages: ChatMessage[];
  videoRooms: VideoRoom[];
  clientes: Cliente[];
  productos: Producto[];
  facturas: Factura[];
  posiciones: PosicionTrabajador[];
  credencialesIntegraciones: Record<TipoIntegracion, CredencialesIntegracion>;
  accounts: DemoPersistedAccount[];
  changeLog: DemoChangeEntry[];
}

export function loadDemoPersistedState(): Partial<DemoPersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<DemoPersistedState>;
  } catch {
    return null;
  }
}

export function saveDemoPersistedState(state: DemoPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private mode — ignore
  }
}

export function clearDemoPersistedState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
