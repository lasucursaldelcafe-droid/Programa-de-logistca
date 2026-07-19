import { useMemo, useState } from "react";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  PERMISSION_CATALOG,
  getPermissionGroups,
  permissionsByGroup,
  permisosDisponiblesParaBase,
  puedeGestionarRolesCustom,
  type CustomRole,
  type CustomRoleBase,
  type SpePermission,
} from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { Card } from "@core/components/ui";
import {
  createCustomRole,
  deleteCustomRole,
  updateCustomRole,
} from "@core/hooks/useDataStore";
import { useCustomRoles } from "@core/hooks/useCustomRoles";

const BASE_ROLE_LABEL: Record<CustomRoleBase, string> = {
  administrador: "Consola admin (acceso amplio)",
  supervisor_sitio: "Supervisor de sitio",
  trabajador: "App trabajador",
};

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  baseRole: "supervisor_sitio" as CustomRoleBase,
  permisos: [] as SpePermission[],
  activo: true,
};

export function RolesPage() {
  const { user } = useAuth();
  const roles = useCustomRoles();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => getPermissionGroups(), []);
  const byGroup = useMemo(() => permissionsByGroup(), []);

  const permisosBase = useMemo(
    () => permisosDisponiblesParaBase(form.baseRole),
    [form.baseRole],
  );

  if (!user || !puedeGestionarRolesCustom(user.role)) {
    return <p className="text-neutral-400">Solo el super administrador puede gestionar roles.</p>;
  }

  const currentUser = user;

  function startEdit(role: CustomRole) {
    setEditingId(role.id);
    setForm({
      nombre: role.nombre,
      descripcion: role.descripcion ?? "",
      baseRole: role.baseRole,
      permisos: [...role.permisos],
      activo: role.activo,
    });
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
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
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        baseRole: form.baseRole,
        permisos: form.permisos,
        activo: form.activo,
      };
      if (editingId) {
        await updateCustomRole(editingId, payload, currentUser.uid, currentUser.nombre);
      } else {
        await createCustomRole(payload, currentUser.uid, currentUser.nombre);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el rol.");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este rol personalizado? Los usuarios asignados volverán a permisos por defecto.")) {
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
        <h1 className="font-display text-3xl font-bold">Roles personalizados</h1>
        <p className="mt-1 max-w-2xl text-neutral-400">
          Crea roles con funciones a medida. El administrador operativo los asigna al registrar
          personal o enviar invitaciones.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">
          {editingId ? "Editar rol" : "Nuevo rol"}
        </h2>
        <form onSubmit={guardar} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-neutral-300">Nombre</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2"
                placeholder="Ej. Coordinador logístico"
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
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Descripción (opcional)</span>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              placeholder="Para qué sirve este rol en la operación"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={aplicarPlantillaBase}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              Usar plantilla de {BASE_ROLE_LABEL[form.baseRole].toLowerCase()}
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
                            <span className="text-neutral-200">{PERMISSION_CATALOG[perm].label}</span>
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
        <h2 className="font-display text-lg font-semibold">Roles definidos ({roles.length})</h2>
        {roles.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Aún no hay roles personalizados. Crea uno arriba para que el administrador lo asigne.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {roles.map((role) => (
              <li
                key={role.id}
                className="rounded-lg border border-border bg-bg px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{role.nombre}</span>
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
