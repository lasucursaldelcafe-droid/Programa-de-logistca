import { useMemo, useState } from "react";
import {
  JERARQUIA_CUENTAS,
  ROLE_CATALOG,
  ROLE_LABEL,
  puedeAsignarRol,
  puedeCrearCuentasPlataforma,
  rolesAsignablesPor,
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

const ROLES_RAIZ: UserRole[] = ["ceo", "master_app"];

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

  /** Roles para crear cuentas de oficina (sin ficha de trabajador). */
  const rolesParaCrear = useMemo(
    () => (user ? rolesCuentaPlataforma(user.role) : []),
    [user],
  );

  /** Roles que se pueden asignar al editar perfiles existentes (oficina + campo). */
  const rolesParaEditar = useMemo(
    () => (user ? rolesAsignablesPor(user.role) : []),
    [user],
  );

  const perfilesEditables = useMemo(() => {
    if (!user) return [];
    return platformUsers.filter((u) => {
      const role = u.role;
      if (ROLES_RAIZ.includes(role)) return false;
      if (variant === "master") {
        // Dirección: todos los perfiles creados (oficina y campo), excepto raíces.
        return true;
      }
      return rolesCuentaPlataforma("ceo").includes(role);
    });
  }, [platformUsers, user, variant]);

  if (!user || !puedeCrearCuentasPlataforma(user.role)) {
    return (
      <PermissionDenied
        role={user?.role}
        title="Sin permiso para crear cuentas administrativas"
        description="Solo Dirección general, Dirección técnica u Operaciones pueden crear estas cuentas."
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
        role: rolesParaCrear[0] ?? "administrador",
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
      ? "Una sola consola: crea el equipo de oficina y cambia el rol de cualquier perfil creado (oficina o campo), excepto Dirección general / técnica."
      : "Crea cuentas de Personas (RH) y Finanzas, y modifica el rol de las existentes. El equipo del evento se gestiona en Equipo del evento.";

  const tituloLista =
    variant === "master"
      ? `Todos los perfiles (${perfilesEditables.length})`
      : `Cuentas administrativas (${perfilesEditables.length})`;

  return (
    <div className="space-y-8">
      <PageHeader title="Equipo de oficina" description={descripcion} />

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

      {rolesParaCrear.length > 0 && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Roles que puedes crear ahora</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {rolesParaCrear.map((rol) => (
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
        <h2 className="font-display text-lg font-semibold">Nueva cuenta de oficina</h2>
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
              {rolesParaCrear.map((rol) => (
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
              disabled={busy || rolesParaCrear.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Creando…" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">{tituloLista}</h2>
        {variant === "master" && (
          <p className="mt-2 text-sm text-neutral-400">
            Puedes cambiar el rol de cualquier cuenta creada (oficina o campo). Las cuentas raíz no aparecen aquí.
          </p>
        )}
        {perfilesEditables.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Aún no hay perfiles para editar. Crea la primera cuenta arriba o registra personal de campo.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {perfilesEditables.map((u) => {
              const puedeEditar =
                u.uid !== user.uid &&
                rolesParaEditar.length > 0 &&
                (puedeAsignarRol(user.role, u.role) || variant === "master");
              return (
                <li
                  key={u.uid}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{u.nombre}</div>
                    <div className="font-mono text-xs text-neutral-500">{u.email}</div>
                    <div className="mt-1 text-xs text-neutral-500">{resumenRol(u.role)}</div>
                  </div>
                  {puedeEditar ? (
                    <label className="flex w-full flex-col gap-1 text-xs text-neutral-400 sm:w-auto sm:min-w-[11rem]">
                      <span>Rol</span>
                      <select
                        value={u.role}
                        disabled={updatingRoleUid === u.uid}
                        onChange={(e) =>
                          void onChangeRole(u.uid, e.target.value as UserRole)
                        }
                        className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-neutral-100 disabled:opacity-50"
                        title="Cambiar rol de esta cuenta"
                      >
                        {!rolesParaEditar.includes(u.role) && (
                          <option value={u.role}>{ROLE_LABEL[u.role]}</option>
                        )}
                        {rolesParaEditar.map((rol) => (
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
                      {u.uid === user.uid ? "Tu cuenta" : ROLE_LABEL[u.role]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
