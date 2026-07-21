import { useMemo, useState } from "react";
import {
  ESTADO_LABEL,
  PERFILES_LABEL,
  ROLE_ACCESS_MODE_LABEL,
  ROLE_LABEL,
  buildWorkerImportTemplateCsv,
  downloadTextFile,
  parseWorkerImportCsv,
  puedeGestionarPersonal,
  rolesPersonalCampo,
  type PerfilTrabajo,
  type UserRole,
  type WorkerBulkImportResult,
  type WorkerEstado,
} from "@spe/shared";

type RolCampo = Extract<UserRole, "supervisor_sitio" | "trabajador">;
import { useAuth } from "../contexts/AuthContext";
import { Badge, Card, PerfilTag } from "../components/ui";
import {
  createWorker,
  toUserFacingError,
  deleteWorker,
  importWorkersBulk,
  setWorkerHabilitado,
  updateWorkerEstado,
  useWorkersState,
} from "../hooks/useDataStore";
import { getCustomRolesForBase, useCustomRoles } from "../hooks/useCustomRoles";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied, DataLoadingSkeleton } from "../components/FeedbackStates";

const PERFILES: PerfilTrabajo[] = [
  "logistica",
  "recreacion",
  "supervisor",
  "montaje",
  "chef",
  "seguridad",
  "anfitrion",
];

export function PersonalPage() {
  const { user } = useAuth();
  const { workers, loading } = useWorkersState();
  const customRoles = useCustomRoles();
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    perfiles: ["logistica"] as PerfilTrabajo[],
    rolPlataforma: "trabajador" as RolCampo,
    customRoleId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<WorkerBulkImportResult | null>(null);

  const rolesAsignables = user ? rolesPersonalCampo(user.role) : [];
  const adminAsignaRoles = rolesAsignables.length > 0;

  const rolesParaBase = useMemo(
    () => getCustomRolesForBase(customRoles, form.rolPlataforma),
    [customRoles, form.rolPlataforma],
  );

  const roleNameById = useMemo(
    () => new Map(customRoles.map((r) => [r.id, r.nombre])),
    [customRoles],
  );

  const roleModeById = useMemo(
    () => new Map(customRoles.map((r) => [r.id, r.modoAcceso])),
    [customRoles],
  );

  const parsedImport = useMemo(() => {
    if (!csvContent) return null;
    return parseWorkerImportCsv(csvContent);
  }, [csvContent]);

  if (!user || !puedeGestionarPersonal(user.role)) {
    return (
      <PermissionDenied
        role={user?.role}
        title="Sin permiso para personal"
        description="Solo administradores y supervisores pueden registrar y gestionar trabajadores."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Personal" description="Cargando…" />
        <DataLoadingSkeleton rows={5} />
      </div>
    );
  }

  const currentUser = user;

  async function crearTrabajador(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    try {
      const nombreGuardado = form.nombre;
      const emailGuardado = form.email.trim().toLowerCase();
      await createWorker(
        {
          ...form,
          rolPlataforma: adminAsignaRoles ? (form.rolPlataforma as RolCampo) : "trabajador",
          customRoleId: form.customRoleId || undefined,
        },
        {
          actorNombre: currentUser.nombre,
          creadaPor: currentUser.uid,
          creadaPorNombre: currentUser.nombre,
          crearCuenta: true,
          enviarInvitacion: false,
        },
      );
      setForm({
        nombre: "",
        documento: "",
        telefono: "",
        email: "",
        perfiles: ["logistica"],
        rolPlataforma: "trabajador",
        customRoleId: "",
      });
      setMensaje(
        `${nombreGuardado} registrado/a. Usuario: ${emailGuardado} · Contraseña inicial: documento (sin puntos ni espacios).`,
      );
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo registrar la persona.").message);
    }
  }

  async function cambiarEstado(id: string, estado: WorkerEstado) {
    await updateWorkerEstado(id, estado, currentUser.nombre);
  }

  async function eliminar(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteWorker(id, currentUser.nombre);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleHabilitado(id: string, habilitado: boolean) {
    await setWorkerHabilitado(id, habilitado, currentUser.nombre);
  }

  function descargarPlantilla() {
    downloadTextFile("plantilla-personal-spe.csv", buildWorkerImportTemplateCsv());
  }

  async function onCsvSelected(file: File | null) {
    setImportResult(null);
    if (!file) {
      setCsvContent(null);
      setCsvFileName(null);
      return;
    }
    const text = await file.text();
    setCsvContent(text);
    setCsvFileName(file.name);
  }

  async function importarCsv() {
    if (!parsedImport || parsedImport.rows.length === 0) return;
    if (parsedImport.issues.length > 0) {
      setError("Corrige los errores del archivo antes de importar.");
      return;
    }
    setImporting(true);
    setError(null);
    setMensaje(null);
    try {
      const result = await importWorkersBulk(parsedImport.rows, {
        actorNombre: currentUser.nombre,
        creadaPor: currentUser.uid,
      });
      setImportResult(result);
      setMensaje(
        `Importación completada: ${result.created} creado(s), ${result.failed} con error.`,
      );
      setCsvContent(null);
      setCsvFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el archivo.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Personal de campo"
        description="Supervisores y empleados de campo. Credenciales: correo = usuario, documento = contraseña inicial. Las cuentas administrativas se crean en Equipo administrativo."
      />

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}
      {mensaje && (
        <p className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
          {mensaje}
        </p>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Nueva persona</h2>
        <p className="mt-1 text-sm text-neutral-400">
          El correo será el usuario de acceso. La contraseña inicial es el número de documento (sin puntos ni espacios).
        </p>
        <form onSubmit={crearTrabajador} className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["nombre", "documento", "telefono", "email"] as const).map((field) => (
            <label key={field} className="text-sm capitalize">
              <span className="mb-1 block text-neutral-300">
                {field === "documento" ? "Documento / cédula (clave inicial)" : field}
              </span>
              <input
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                required={field !== "telefono"}
              />
            </label>
          ))}
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-neutral-300">Perfiles</span>
            <select
              multiple
              value={form.perfiles}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  perfiles: Array.from(e.target.selectedOptions, (o) => o.value as PerfilTrabajo),
                }))
              }
              className="h-28 w-full rounded-lg border border-border bg-bg px-3 py-2"
            >
              {PERFILES.map((p) => (
                <option key={p} value={p}>
                  {PERFILES_LABEL[p] ?? p}
                </option>
              ))}
            </select>
          </label>
          {adminAsignaRoles && (
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-neutral-300">Rol en la plataforma</span>
              <select
                value={form.rolPlataforma}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rolPlataforma: e.target.value as RolCampo,
                    customRoleId: "",
                  }))
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                {rolesAsignables.map((rol) => (
                  <option key={rol} value={rol}>
                    {ROLE_LABEL[rol]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {adminAsignaRoles && rolesParaBase.length > 0 && (
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-neutral-300">Rol personalizado (opcional)</span>
              <select
                value={form.customRoleId}
                onChange={(e) => setForm((f) => ({ ...f, customRoleId: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                <option value="">Permisos por defecto del rol base</option>
                {rolesParaBase.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} ({r.permisos.length} funciones)
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
            >
              Registrar trabajador
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Carga masiva (CSV)</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Descarga la plantilla, complétala en Excel o Google Sheets y súbela para crear cuentas en lote.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={descargarPlantilla}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/50"
          >
            Descargar plantilla CSV
          </button>
          <label className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black">
            Seleccionar archivo
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void onCsvSelected(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {csvFileName && (
          <p className="mt-2 text-xs text-neutral-500">
            Archivo: {csvFileName}
            {parsedImport ? ` · ${parsedImport.rows.length} fila(s) válida(s)` : ""}
          </p>
        )}
        {parsedImport && parsedImport.issues.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-alert">
            {parsedImport.issues.map((issue, i) => (
              <li key={`${issue.line}-${i}`}>
                Línea {issue.line}
                {issue.field ? ` (${issue.field})` : ""}: {issue.message}
              </li>
            ))}
          </ul>
        )}
        {parsedImport && parsedImport.rows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Documento</th>
                  <th className="py-2 pr-3">Correo</th>
                  <th className="py-2 pr-3">Perfiles</th>
                  <th className="py-2">Rol</th>
                </tr>
              </thead>
              <tbody>
                {parsedImport.rows.slice(0, 8).map((row) => (
                  <tr key={row.line} className="border-t border-border/50">
                    <td className="py-2 pr-3">{row.nombre}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{row.documento}</td>
                    <td className="py-2 pr-3">{row.email}</td>
                    <td className="py-2 pr-3">{row.perfiles.join(" | ")}</td>
                    <td className="py-2">{row.rolPlataforma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedImport.rows.length > 8 && (
              <p className="mt-2 text-xs text-neutral-500">
                … y {parsedImport.rows.length - 8} fila(s) más
              </p>
            )}
          </div>
        )}
        {parsedImport && parsedImport.rows.length > 0 && parsedImport.issues.length === 0 && (
          <button
            type="button"
            disabled={importing}
            onClick={() => void importarCsv()}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {importing
              ? "Importando…"
              : `Importar ${parsedImport.rows.length} trabajador(es)`}
          </button>
        )}
        {importResult && importResult.failed > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-alert">
            {importResult.results
              .filter((r) => !r.ok)
              .map((r) => (
                <li key={`${r.line}-${r.email}`}>
                  Línea {r.line} ({r.email}): {r.error}
                </li>
              ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4">
        {workers.length === 0 && (
          <p className="text-sm text-neutral-500">No hay personal registrado.</p>
        )}
        {workers.map((w) => (
          <Card key={w.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-display text-lg font-semibold">{w.nombre}</div>
              <div className="mt-1 font-mono text-xs text-neutral-500">
                {w.documento} · {w.email}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Rol: {ROLE_LABEL[w.rolPlataforma ?? "trabajador"]}
                {w.customRoleId && roleNameById.get(w.customRoleId)
                  ? ` · ${roleNameById.get(w.customRoleId)}`
                  : ""}
                {w.customRoleId && roleModeById.get(w.customRoleId)
                  ? ` (${ROLE_ACCESS_MODE_LABEL[roleModeById.get(w.customRoleId)!]})`
                  : ""}
                {w.cuentaCreada ? " · Cuenta activa" : " · Sin activar"}
                {w.habilitado === false ? " · Inhabilitado" : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.perfiles.map((p) => (
                  <PerfilTag key={p} label={PERFILES_LABEL[p] ?? p} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={ESTADO_LABEL[w.estado]} tone={w.estado} />
              <select
                value={w.estado}
                onChange={(e) => cambiarEstado(w.id, e.target.value as WorkerEstado)}
                className="rounded-lg border border-border bg-bg px-2 py-1 text-xs"
              >
                {Object.entries(ESTADO_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => toggleHabilitado(w.id, w.habilitado === false)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  w.habilitado === false
                    ? "border-positive/40 text-positive hover:bg-positive/10"
                    : "border-neutral-600 text-neutral-400 hover:border-alert/40 hover:text-alert"
                }`}
              >
                {w.habilitado === false ? "Habilitar acceso" : "Inhabilitar acceso"}
              </button>
              {confirmDeleteId === w.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={deletingId === w.id}
                    onClick={() => eliminar(w.id)}
                    className="rounded-lg bg-alert px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {deletingId === w.id ? "Eliminando…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(w.id)}
                  className="rounded-lg border border-alert/40 px-3 py-1.5 text-xs text-alert hover:bg-alert/10"
                >
                  Eliminar
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
