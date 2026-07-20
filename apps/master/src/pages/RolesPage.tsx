import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  PERMISSION_CATALOG,
  ROLE_ACCESS_MODE_LABEL,
  ROLE_TEMPLATES,
  getPermissionGroups,
  getRoleTemplateCategories,
  getRoleTemplatesByCategory,
  permissionsByGroup,
  permisosDisponiblesParaBase,
  puedeGestionarRolesCustom,
  roleTemplateToFormValues,
  type CustomRole,
  type CustomRoleBase,
  type RoleAccessMode,
  type RoleTemplate,
  type SpePermission,
} from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { Card } from "@core/components/ui";
import {
  createCustomRole,
  deleteCustomRole,
  importRoleTemplatesFromCatalog,
  updateCustomRole,
} from "@core/hooks/useDataStore";
import { useCustomRoles } from "@core/hooks/useCustomRoles";

const BASE_ROLE_LABEL: Record<CustomRoleBase, string> = {
  administrador: "Consola admin (acceso amplio)",
  supervisor_sitio: "Supervisor de sitio",
  trabajador: "App trabajador",
};

type RoleForm = {
  nombre: string;
  descripcion: string;
  baseRole: CustomRoleBase;
  permisos: SpePermission[];
  activo: boolean;
  modoAcceso: RoleAccessMode | "";
  plantillaId: string;
};

const EMPTY_FORM: RoleForm = {
  nombre: "",
  descripcion: "",
  baseRole: "supervisor_sitio",
  permisos: [],
  activo: true,
  modoAcceso: "",
  plantillaId: "",
};

function AccessModeBadge({ mode }: { mode?: RoleAccessMode }) {
  if (!mode) return null;
  const isRead = mode === "lectura";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isRead
          ? "bg-neutral-800 text-neutral-300"
          : "bg-accent/20 text-accent"
      }`}
    >
      {ROLE_ACCESS_MODE_LABEL[mode]}
    </span>
  );
}

export function RolesPage() {
  const { user } = useAuth();
  const roles = useCustomRoles();
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCatalogo, setShowCatalogo] = useState(false);

  const groups = useMemo(() => getPermissionGroups(), []);
  const byGroup = useMemo(() => permissionsByGroup(), []);
  const categorias = useMemo(() => getRoleTemplateCategories(), []);

  const plantillasFiltradas = useMemo(
    () => getRoleTemplatesByCategory(filterCategoria || undefined),
    [filterCategoria],
  );

  const importedTemplateIds = useMemo(
    () => new Set(roles.map((r) => r.plantillaId).filter(Boolean)),
    [roles],
  );

  const permisosBase = useMemo(
    () => permisosDisponiblesParaBase(form.baseRole),
    [form.baseRole],
  );

  if (!user || !puedeGestionarRolesCustom(user.role)) {
    return <p className="text-neutral-400">Solo el super administrador puede gestionar roles.</p>;
  }

  const currentUser = user;

  function aplicarPlantilla(template: RoleTemplate, importar = false) {
    const values = roleTemplateToFormValues(template);
    setForm({
      nombre: values.nombre,
      descripcion: values.descripcion,
      baseRole: values.baseRole,
      permisos: values.permisos,
      activo: true,
      modoAcceso: values.modoAcceso,
      plantillaId: values.plantillaId,
    });
    setEditingId(null);
    setError(null);
    setSuccess(
      importar
        ? null
        : `Plantilla «${template.puesto}» cargada en el formulario. Ajusta y guarda.`,
    );
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function startEdit(role: CustomRole) {
    setEditingId(role.id);
    setForm({
      nombre: role.nombre,
      descripcion: role.descripcion ?? "",
      baseRole: role.baseRole,
      permisos: [...role.permisos],
      activo: role.activo,
      modoAcceso: role.modoAcceso ?? "",
      plantillaId: role.plantillaId ?? "",
    });
    setError(null);
    setSuccess(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
  }

  function togglePermiso(perm: SpePermission) {
    setForm((f) => ({
      ...f,
      permisos: f.permisos.includes(perm)
        ? f.permisos.filter((p) => p !== perm)
        : [...f.permisos, perm],
    }));
  }

  function aplicarPlantillaBase() {
    setForm((f) => ({
      ...f,
      permisos: [...DEFAULT_PERMISSIONS_BY_ROLE[f.baseRole]],
      plantillaId: "",
    }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre del rol es obligatorio.");
      return;
    }
    if (form.permisos.length === 0) {
      setError("Selecciona al menos una función para este rol.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        baseRole: form.baseRole,
        permisos: form.permisos,
        activo: form.activo,
        modoAcceso: form.modoAcceso || undefined,
        plantillaId: form.plantillaId || undefined,
      };
      if (editingId) {
        await updateCustomRole(editingId, payload, currentUser.uid, currentUser.nombre);
        setSuccess("Rol actualizado.");
      } else {
        await createCustomRole(payload, currentUser.uid, currentUser.nombre);
        setSuccess("Rol creado.");
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el rol.");
    } finally {
      setBusy(false);
    }
  }

  async function importarPlantilla(template: RoleTemplate) {
    if (importedTemplateIds.has(template.id)) {
      setError("Esta plantilla ya fue importada. Puedes editarla en la lista de roles.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const values = roleTemplateToFormValues(template);
      await createCustomRole(
        {
          nombre: values.nombre,
          descripcion: values.descripcion,
          baseRole: values.baseRole,
          permisos: values.permisos,
          activo: true,
          modoAcceso: values.modoAcceso,
          plantillaId: values.plantillaId,
        },
        currentUser.uid,
        currentUser.nombre,
      );
      setSuccess(`Rol «${values.nombre}» importado desde plantilla.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar la plantilla.");
    } finally {
      setBusy(false);
    }
  }

  async function importarTodasPlantillas() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const count = await importRoleTemplatesFromCatalog(
        roles,
        currentUser.uid,
        currentUser.nombre,
      );
      setSuccess(
        count > 0
          ? `Se importaron ${count} puestos de ejemplo.`
          : "Todas las plantillas ya estaban importadas.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron importar las plantillas.");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(id: string) {
    if (
      !window.confirm(
        "¿Eliminar este rol personalizado? Los usuarios asignados volverán a permisos por defecto.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteCustomRole(id);
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Roles y puestos</h1>
        <p className="mt-1 max-w-2xl text-neutral-400">
          Como super administrador, defines los puestos que el equipo operativo asignará al registrar
          personal.
        </p>
      </div>

      <Card className="border-accent/20 bg-accent/5">
        <h2 className="font-display text-lg font-semibold text-neutral-100">Cómo crear roles (3 pasos)</h2>
        <ol className="mt-4 space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
              1
            </span>
            <div>
              <p className="font-medium text-neutral-200">Importa plantillas de puesto</p>
              <p className="mt-1 text-neutral-400">
                El catálogo trae coordinadores, logística, seguridad y más — con permisos de lectura o
                editor ya definidos.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void importarTodasPlantillas()}
                className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {busy ? "Importando…" : "Importar todas las plantillas"}
              </button>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold text-neutral-400">
              2
            </span>
            <div>
              <p className="font-medium text-neutral-200">Personaliza si lo necesitas</p>
              <p className="mt-1 text-neutral-400">
                Edita un rol importado o crea uno nuevo con el formulario de abajo. Ajusta nombre,
                permisos y modo lectura/editor.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold text-neutral-400">
              3
            </span>
            <div>
              <p className="font-medium text-neutral-200">Asigna al registrar personal</p>
              <p className="mt-1 text-neutral-400">
                El administrador operativo elige el puesto en{" "}
                <Link to="/personal" className="text-accent underline">
                  Personal → Nuevo trabajador
                </Link>
                . No hace falta volver aquí para cada persona.
              </p>
            </div>
          </li>
        </ol>
      </Card>

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-positive/10 px-3 py-2 text-sm text-positive">{success}</p>
      )}

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Catálogo de puestos</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {ROLE_TEMPLATES.length} plantillas · {importedTemplateIds.size} ya importadas ·{" "}
              {roles.length} roles activos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCatalogo((v) => !v)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              {showCatalogo ? "Ocultar catálogo" : "Ver catálogo completo"}
            </button>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showCatalogo && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plantillasFiltradas.map((template) => {
              const yaImportada = importedTemplateIds.has(template.id);
              return (
                <li
                  key={template.id}
                  className="flex flex-col rounded-xl border border-border bg-bg/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-100">{template.puesto}</span>
                    <AccessModeBadge mode={template.modoAcceso} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {template.categoria} · {BASE_ROLE_LABEL[template.baseRole]}
                  </p>
                  <p className="mt-2 flex-1 text-sm text-neutral-400">{template.descripcion}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {template.permisos.length} funciones
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => aplicarPlantilla(template)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                    >
                      Personalizar
                    </button>
                    <button
                      type="button"
                      disabled={busy || yaImportada}
                      onClick={() => void importarPlantilla(template)}
                      className="rounded-lg border border-accent/40 px-2.5 py-1 text-xs text-accent disabled:opacity-40"
                    >
                      {yaImportada ? "Importada" : "Importar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">
          {editingId ? "Editar rol" : "Rol personalizado"}
        </h2>
        <form onSubmit={guardar} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-neutral-300">Nombre del puesto</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                placeholder="Ej. Coordinador logístico (editor)"
                required
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-neutral-300">Plataforma base</span>
              <select
                value={form.baseRole}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    baseRole: e.target.value as CustomRoleBase,
                    permisos: [],
                    plantillaId: "",
                  }))
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                {(Object.keys(BASE_ROLE_LABEL) as CustomRoleBase[]).map((key) => (
                  <option key={key} value={key}>
                    {BASE_ROLE_LABEL[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-neutral-300">Modo de acceso</span>
              <select
                value={form.modoAcceso}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    modoAcceso: e.target.value as RoleAccessMode | "",
                  }))
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              >
                <option value="">Sin especificar</option>
                <option value="lectura">Solo lectura</option>
                <option value="editor">Editor (puede modificar)</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Descripción (opcional)</span>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              placeholder="Para qué sirve este puesto en la operación"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={aplicarPlantillaBase}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              Permisos por defecto del rol base
            </button>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
              />
              Rol activo
            </label>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-4">
            <p className="text-sm font-medium text-neutral-200">Funciones incluidas</p>
            {groups.map((group) => {
              const perms = (byGroup[group] ?? []).filter((p) => permisosBase.includes(p));
              if (perms.length === 0) return null;
              return (
                <div key={group}>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">{group}</p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {perms.map((perm) => (
                      <li key={perm}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-surface/50">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={form.permisos.includes(perm)}
                            onChange={() => togglePermiso(perm)}
                          />
                          <span>
                            <span className="text-neutral-200">
                              {PERMISSION_CATALOG[perm].label}
                            </span>
                            {PERMISSION_CATALOG[perm].descripcion && (
                              <span className="mt-0.5 block text-xs text-neutral-500">
                                {PERMISSION_CATALOG[perm].descripcion}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Guardando…" : editingId ? "Actualizar rol" : "Crear rol"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-400"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Roles activos ({roles.length})</h2>
        {roles.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Importa plantillas del catálogo o crea un rol personalizado arriba.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {roles.map((role) => (
              <li key={role.id} className="rounded-lg border border-border bg-bg px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{role.nombre}</span>
                      <AccessModeBadge mode={role.modoAcceso} />
                      {!role.activo && (
                        <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      Base: {BASE_ROLE_LABEL[role.baseRole]} · {role.permisos.length} funciones
                    </p>
                    {role.descripcion && (
                      <p className="mt-2 text-sm text-neutral-400">{role.descripcion}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(role)}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-neutral-300"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void eliminar(role.id)}
                      className="rounded-lg border border-alert/40 px-3 py-1 text-xs text-alert"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
