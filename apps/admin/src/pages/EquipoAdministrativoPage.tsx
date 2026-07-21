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
  deletePlatformAccount,
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
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

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
    const q = busqueda.trim().toLowerCase();
    return platformUsers
      .filter((u) => {
        const role = u.role;
        if (ROLES_RAIZ.includes(role)) return false;
        if (variant === "master") {
          // Dirección: todos los perfiles creados (oficina y campo), excepto raíces.
        } else if (!rolesCuentaPlataforma("ceo").includes(role)) {
          return false;
        }
        if (!q) return true;
        return (
          u.nombre.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          ROLE_LABEL[u.role].toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [platformUsers, user, variant, busqueda]);

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

  async function onEliminarPerfil(target: { uid: string; nombre: string; email: string; role: UserRole }) {
    if (!user) return;
    if (
      !window.confirm(
        `¿Eliminar el perfil de «${target.nombre}» (${target.email})?\n\nSe borrará su acceso a la plataforma. Si tiene ficha de personal, la ficha se conserva y se podrá reactivar la cuenta después.`,
      )
    ) {
      return;
    }
    setDeletingUid(target.uid);
    setError(null);
    setMensaje(null);
    try {
      await deletePlatformAccount(target.uid, user);
      setMensaje(`Perfil «${target.nombre}» eliminado.`);
    } catch (err) {
      setError(toUserFacingError(err, "No se pudo eliminar el perfil.").message);
    } finally {
      setDeletingUid(null);
    }
  }

  const descripcion =
    variant === "master"
      ? "Aquí modificas o eliminas el rol de cualquier cuenta creada (oficina o campo): por ejemplo pabcolgom@gmail.com o Jhonny. Busca por nombre o correo, cambia el rol o elimina el perfil."
      : "Crea cuentas de Personas (RH) y Finanzas, modifica el rol de las existentes o elimínalas. El equipo del evento se gestiona en Equipo del evento.";

  const tituloPagina = variant === "master" ? "Perfiles y roles" : "Equipo de oficina";
  const tituloLista =
    variant === "master"
      ? `Todos los perfiles (${perfilesEditables.length})`
      : `Cuentas administrativas (${perfilesEditables.length})`;

  return (
    <div className="space-y-8">
      <PageHeader title={tituloPagina} description={descripcion} />

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
            Incluye supervisores y trabajadores con cuenta (p. ej. Pablo, Jhonny) y el equipo de oficina. Las cuentas raíz no aparecen aquí.
          </p>
        )}
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-neutral-400">Buscar por nombre o correo</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. pabcolgom@gmail.com o Jhonny"
            className="w-full max-w-md rounded-lg border border-border bg-bg px-3 py-2"
          />
        </label>
        {perfilesEditables.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            {busqueda.trim()
              ? "Ningún perfil coincide con la búsqueda."
              : "Aún no hay perfiles para editar. Crea la primera cuenta arriba o registra personal de campo."}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {perfilesEditables.map((u) => {
              const puedeEditar =
                u.uid !== user.uid &&
                rolesParaEditar.length > 0 &&
                (puedeAsignarRol(user.role, u.role) || variant === "master");
              const puedeEliminar =
                u.uid !== user.uid &&
                !ROLES_RAIZ.includes(u.role) &&
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
                  <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
                    {puedeEditar ? (
                      <label className="flex min-w-[11rem] flex-1 flex-col gap-1 text-xs text-neutral-400 sm:flex-none">
                        <span>Rol</span>
                        <select
                          value={u.role}
                          disabled={updatingRoleUid === u.uid || deletingUid === u.uid}
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
                    {puedeEliminar && (
                      <button
                        type="button"
                        disabled={busy || deletingUid === u.uid || updatingRoleUid === u.uid}
                        onClick={() => void onEliminarPerfil(u)}
                        className="rounded-lg border border-alert/40 px-3 py-1.5 text-xs text-alert disabled:opacity-50"
                      >
                        {deletingUid === u.uid ? "Eliminando…" : "Eliminar"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
