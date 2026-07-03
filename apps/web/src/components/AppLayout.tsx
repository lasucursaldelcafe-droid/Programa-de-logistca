import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLE_LABEL, puedeGestionarCuentas, puedeGestionarPersonal } from "@spe/shared";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-accent/15 text-accent"
      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
  }`;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">
              Personal Eventos
            </div>
            <div className="text-xs text-neutral-500">
              {user.nombre} · {ROLE_LABEL[user.role]}
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Inicio
            </NavLink>
            {puedeGestionarPersonal(user.role) && (
              <NavLink to="/personal" className={linkClass}>
                Personal
              </NavLink>
            )}
            {puedeGestionarCuentas(user.role) && (
              <NavLink to="/cuentas" className={linkClass}>
                Cuentas
              </NavLink>
            )}
            <NavLink to="/turnos" className={linkClass}>
              Turnos
            </NavLink>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="ml-2 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-white"
            >
              Salir
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
