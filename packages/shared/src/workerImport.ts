import type { PerfilTrabajo } from "./types";
import { workerDocumentPassword } from "./workerCredentials";

export const WORKER_IMPORT_COLUMNS = [
  "nombre",
  "documento",
  "email",
  "telefono",
  "perfiles",
  "rol",
] as const;

export type WorkerImportColumn = (typeof WORKER_IMPORT_COLUMNS)[number];

export interface WorkerImportRow {
  line: number;
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  perfiles: PerfilTrabajo[];
  rolPlataforma: "trabajador" | "supervisor_sitio";
}

export interface WorkerImportParseIssue {
  line: number;
  field?: string;
  message: string;
}

export interface WorkerImportParseResult {
  rows: WorkerImportRow[];
  issues: WorkerImportParseIssue[];
}

const VALID_ROLES = new Set(["trabajador", "supervisor_sitio"]);

const EXAMPLE_ROW: Record<WorkerImportColumn, string> = {
  nombre: "María Pérez",
  documento: "1234567890",
  email: "maria.perez@empresa.com",
  telefono: "3001234567",
  perfiles: "logistica|montaje",
  rol: "trabajador",
};

/** Plantilla CSV descargable con encabezados y fila de ejemplo. */
export function buildWorkerImportTemplateCsv(): string {
  const header = WORKER_IMPORT_COLUMNS.join(",");
  const example = WORKER_IMPORT_COLUMNS.map((col) => csvEscape(EXAMPLE_ROW[col])).join(",");
  const help = [
    "# SPE — Plantilla de personal",
    "# perfiles: separados por | (ej. logistica|chef|seguridad)",
    "# rol: trabajador o supervisor_sitio (opcional, default trabajador)",
    "# Usuario = email · Contraseña inicial = documento (sin puntos ni espacios)",
  ].join("\n");
  return `${help}\n${header}\n${example}\n`;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parsePerfiles(raw: string): PerfilTrabajo[] {
  const parts = raw
    .split(/[|;]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) return ["logistica"];
  return parts as PerfilTrabajo[];
}

function normalizeHeader(cell: string): WorkerImportColumn | null {
  const key = cell.trim().toLowerCase().replace(/\s+/g, "_");
  const aliases: Record<string, WorkerImportColumn> = {
    nombre: "nombre",
    name: "nombre",
    documento: "documento",
    cedula: "documento",
    cédula: "documento",
    identificacion: "documento",
    identificación: "documento",
    email: "email",
    correo: "email",
    telefono: "telefono",
    teléfono: "telefono",
    phone: "telefono",
    perfiles: "perfiles",
    perfil: "perfiles",
    rol: "rol",
    role: "rol",
  };
  return aliases[key] ?? null;
}

/** Parsea CSV/TSV de personal. Ignora líneas vacías y comentarios (#). */
export function parseWorkerImportCsv(content: string): WorkerImportParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  const rows: WorkerImportRow[] = [];
  const issues: WorkerImportParseIssue[] = [];

  if (lines.length === 0) {
    issues.push({ line: 0, message: "El archivo está vacío." });
    return { rows, issues };
  }

  const headerCells = parseCsvLine(lines[0]!);
  const columnIndex = new Map<WorkerImportColumn, number>();

  headerCells.forEach((cell, index) => {
    const col = normalizeHeader(cell);
    if (col) columnIndex.set(col, index);
  });

  const required: WorkerImportColumn[] = ["nombre", "documento", "email"];
  for (const col of required) {
    if (!columnIndex.has(col)) {
      issues.push({
        line: 1,
        field: col,
        message: `Falta la columna obligatoria «${col}». Descarga la plantilla oficial.`,
      });
    }
  }

  if (issues.some((i) => i.line === 1 && i.field)) {
    return { rows, issues };
  }

  const dataLines = lines.slice(1);
  if (dataLines.length === 0) {
    issues.push({ line: 1, message: "No hay filas de datos (solo encabezados)." });
    return { rows, issues };
  }

  const seenEmails = new Set<string>();
  const seenDocumentos = new Set<string>();

  dataLines.forEach((line, idx) => {
    const lineNumber = idx + 2;
    const cells = parseCsvLine(line);

    const get = (col: WorkerImportColumn): string => {
      const i = columnIndex.get(col);
      return i === undefined ? "" : (cells[i] ?? "").trim();
    };

    const nombre = get("nombre");
    const documento = get("documento");
    const email = get("email").toLowerCase();
    const telefono = get("telefono");
    const perfilesRaw = get("perfiles");
    const rolRaw = get("rol").toLowerCase() || "trabajador";

    if (!nombre) {
      issues.push({ line: lineNumber, field: "nombre", message: "Nombre requerido." });
      return;
    }
    if (!documento) {
      issues.push({ line: lineNumber, field: "documento", message: "Documento requerido." });
      return;
    }
    if (!email || !email.includes("@")) {
      issues.push({ line: lineNumber, field: "email", message: "Correo inválido." });
      return;
    }

    try {
      workerDocumentPassword(documento);
    } catch (err) {
      issues.push({
        line: lineNumber,
        field: "documento",
        message: err instanceof Error ? err.message : "Documento inválido para contraseña.",
      });
      return;
    }

    if (!VALID_ROLES.has(rolRaw)) {
      issues.push({
        line: lineNumber,
        field: "rol",
        message: `Rol «${rolRaw}» inválido. Use trabajador o supervisor_sitio.`,
      });
      return;
    }

    if (seenEmails.has(email)) {
      issues.push({ line: lineNumber, field: "email", message: `Correo duplicado en el archivo: ${email}` });
      return;
    }
    if (seenDocumentos.has(documento)) {
      issues.push({
        line: lineNumber,
        field: "documento",
        message: `Documento duplicado en el archivo: ${documento}`,
      });
      return;
    }

    seenEmails.add(email);
    seenDocumentos.add(documento);

    rows.push({
      line: lineNumber,
      nombre,
      documento,
      email,
      telefono,
      perfiles: parsePerfiles(perfilesRaw),
      rolPlataforma: rolRaw as "trabajador" | "supervisor_sitio",
    });
  });

  return { rows, issues };
}

export interface WorkerBulkImportRowResult {
  line: number;
  email: string;
  nombre: string;
  ok: boolean;
  workerId?: string;
  error?: string;
}

export interface WorkerBulkImportResult {
  created: number;
  failed: number;
  results: WorkerBulkImportRowResult[];
}
