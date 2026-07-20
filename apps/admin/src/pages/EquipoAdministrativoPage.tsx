import { useMemo, useState } from "react";
import {
  ROLE_LABEL,
  puedeCrearCuentasPlataforma,
  rolesCuentaPlataforma,
  type UserRole,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { PageHeader } from "../components/nav/PageHeader";
import { PermissionDenied } from "../components/FeedbackStates";
import { createPlatformAccount, usePlatformUsers } from "../hooks/useDataStore";

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
        description="Solo CEO, Master App o Administrador pueden crear cuentas de equipo administrativo."
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
        `Cuenta «${form.nombre.trim()}» creada (${ROLE_LABEL[form.role]}). El usuario puede iniciar sesión con ${form.email.trim()}.`,
      );
      setForm({
        nombre: "",
        email: "",
        password: "",
        role: rolesDisponibles[0] ?? "administrador",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  const titulo = variant === "master" ? "Equipo administrativo" : "Equipo administrativo";
  const descripcion =
    variant === "master"
      ? "Como cuenta raíz (CEO o Master App), crea Administrador, Recursos Humanos y Contador. Ellos podrán crear más cuentas según su rol."
      : "Crea cuentas para Recursos Humanos y Contador. El personal de campo se registra en Personal de campo.";

  return (
    <div className="space-y-8">
      <PageHeader title={titulo} description={descripcion} />

      <Card className="border-accent/20 bg-accent/5">
        <h2 className="font-display text-lg font-semibold">Jerarquía de cuentas</h2>
        <ol className="mt-3 space-y-2 text-sm text-neutral-300">
          <li>
            <strong className="text-accent">CEO / Master App</strong> → crea Administrador, RH, Contador
          </li>
          <li>
            <strong className="text-neutral-200">Administrador</strong> → crea RH, Contador y personal de
            campo
          </li>
          <li>
            <strong className="text-neutral-200">Recursos Humanos</strong> → registra supervisores y
            empleados
          </li>
          <li>
            <strong className="text-neutral-200">Contador</strong> → ve nómina, facturación e inventario
            (sin crear cuentas)
          </li>
          <li>
            <strong className="text-neutral-200">Supervisor / Empleado</strong> → app de campo
          </li>
        </ol>
      </Card>

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
                <div>
                  <div className="font-medium">{u.nombre}</div>
                  <div className="font-mono text-xs text-neutral-500">{u.email}</div>
                </div>
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs">
                  {ROLE_LABEL[u.role]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
