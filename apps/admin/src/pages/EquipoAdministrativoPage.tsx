import { useMemo, useState } from "react";
import {
  JERARQUIA_CUENTAS,
  ROLE_CATALOG,
  ROLE_LABEL,
  puedeCrearCuentasPlataforma,
  rolesCuentaPlataforma,
  resumenRol,
  type UserRole,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied } from "../components/FeedbackStates";
import {
  createPlatformAccount,
  toUserFacingError,
  updatePlatformUserRole,
  usePlatformUsers,
} from "../hooks/useDataStore";

interface EquipoAdministrativoPageProps {
  /** Vista desde consola Master (CEO/Master App) */
  variant?: "master" | "admin";
}

export function EquipoAdministrativoPage({ variant = "admin" }: EquipoAdministrativoPageProps) {
  const { user } = useAuth();
  const platformUsers = usePlatformUsers();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "administrador" as UserRole,
  });
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);

  const rolesDisponibles = useMemo(
    () => (user ? rolesCuentaPlataforma(user.role) : []),
    [user],
  );

  const equipoAdmin = useMemo(
    () =>
      platformUsers.filter((u) =>
        rolesCuentaPlataforma("ceo").includes(u.role),
      ),
    [platformUsers],
  );

  if (!user || !puedeCrearCuentasPlataforma(user.role)) {
    return (
      <PermissionDenied
        role={user?.role}
        title="Sin permiso para crear cuentas administrativas"
        description="Solo CEO, Master App o Administrador de operaciones pueden crear estas cuentas."
      />
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setMensaje(null);
    try {
      await createPlatformAccount(form, user);
      setMensaje(
        `Cuenta «${form.nombre.trim()}» creada (${ROLE_LABEL[form.role]}). Puede iniciar sesión con ${form.email.trim()}.`,
      );
      setForm({
        nombre: "",
        email: "",
        password: "",
        role: rolesDisponibles[0] ?? "administrador",
      });
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo crear la cuenta.").message);
    } finally {
      setBusy(false);
    }
  }

  async function onChangeRole(targetUid: string, role: UserRole) {
    if (!user) return;
    setUpdatingRoleUid(targetUid);
    setError(null);
    setMensaje(null);
    try {
      await updatePlatformUserRole(targetUid, role, user);
      setMensaje(`Rol actualizado a «${ROLE_LABEL[role]}».`);
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo cambiar el rol.").message);
    } finally {
      setUpdatingRoleUid(null);
    }
  }

  const descripcion =
    variant === "master"
      ? "Al inicio solo existen CEO y Master App. Desde aquí creas el equipo administrativo y puedes cambiar el rol de las cuentas ya creadas."
      : "Crea cuentas de Recursos Humanos y Contabilidad, y modifica el rol de las existentes. El personal de campo se gestiona en Personal de campo.";

  return (
    <div className="space-y-8">
      <PageHeader title="Equipo administrativo" description={descripcion} />

      <Card className="border-accent/20 bg-accent/5">
        <h2 className="font-display text-lg font-semibold">Cómo se crean las cuentas</h2>
        <ol className="mt-3 space-y-3 text-sm text-neutral-300">
          {JERARQUIA_CUENTAS.map((paso) => (
            <li key={paso.titulo}>
              <strong className="text-neutral-100">{paso.titulo}</strong>
              <p className="mt-0.5 text-neutral-400">{paso.detalle}</p>
            </li>
          ))}
        </ol>
      </Card>

      {rolesDisponibles.length > 0 && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Roles que puedes crear ahora</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {rolesDisponibles.map((rol) => (
              <li key={rol} className="rounded-lg border border-border bg-bg px-3 py-2">
                <span className="font-medium text-accent">{ROLE_LABEL[rol]}</span>
                <span className="mt-0.5 block text-neutral-400">{resumenRol(rol)}</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  Ve: {ROLE_CATALOG[rol].puedeVer.slice(0, 3).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {error && (
        <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
      )}
      {mensaje && (
        <p className="rounded-lg bg-positive/10 px-3 py-2 text-sm text-positive">{mensaje}</p>
      )}

      <Card>
        <h2 className="font-display text-lg font-semibold">Nueva cuenta administrativa</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-neutral-300">Nombre completo *</span>
            <input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-300">Correo (usuario) *</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-300">Contraseña inicial *</span>
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
              required
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-neutral-300">Rol *</span>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2"
            >
              {rolesDisponibles.map((rol) => (
                <option key={rol} value={rol}>
                  {ROLE_LABEL[rol]}
                </option>
              ))}
            </select>
            {form.role && (
              <p className="mt-1 text-xs text-neutral-500">{resumenRol(form.role)}</p>
            )}
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy || rolesDisponibles.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Creando…" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">
          Cuentas administrativas ({equipoAdmin.length})
        </h2>
        {equipoAdmin.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Aún no hay cuentas administrativas. Crea la primera arriba.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {equipoAdmin.map((u) => (
              <li
                key={u.uid}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{u.nombre}</div>
                  <div className="font-mono text-xs text-neutral-500">{u.email}</div>
                  <div className="mt-1 text-xs text-neutral-500">{resumenRol(u.role)}</div>
                </div>
                {rolesDisponibles.length > 0 ? (
                  <label className="flex w-full flex-col gap-1 text-xs text-neutral-400 sm:w-auto sm:min-w-[11rem]">
                    <span>Rol</span>
                    <select
                      value={u.role}
                      disabled={updatingRoleUid === u.uid || u.uid === user.uid}
                      onChange={(e) =>
                        void onChangeRole(u.uid, e.target.value as UserRole)
                      }
                      className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-neutral-100 disabled:opacity-50"
                      title={
                        u.uid === user.uid
                          ? "No puedes cambiar tu propio rol"
                          : "Cambiar rol de esta cuenta"
                      }
                    >
                      {!rolesDisponibles.includes(u.role) && (
                        <option value={u.role}>{ROLE_LABEL[u.role]}</option>
                      )}
                      {rolesDisponibles.map((rol) => (
                        <option key={rol} value={rol}>
                          {ROLE_LABEL[rol]}
                        </option>
                      ))}
                    </select>
                    {updatingRoleUid === u.uid && (
                      <span className="text-accent">Guardando…</span>
                    )}
                  </label>
                ) : (
                  <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs">
                    {ROLE_LABEL[u.role]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
