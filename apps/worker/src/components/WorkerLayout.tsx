import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ROLE_LABEL } from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { NotificationBell } from "@core/components/NotificationBell";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-accent/15 text-accent"
      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
  }`;

export function WorkerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          <div>
            <div className="font-display text-base font-semibold">App Trabajador</div>
            <div className="text-xs text-neutral-500">
              {user.nombre} · {ROLE_LABEL[user.role]}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:text-white"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          <NavLink to="/worker" end className={linkClass}>
            Inicio
          </NavLink>
          <NavLink to="/worker/turnos" className={linkClass}>
            Turnos
          </NavLink>
          <NavLink to="/worker/entrada" className={linkClass}>
            Escanear
          </NavLink>
          <NavLink to="/worker/reportar" className={linkClass}>
            Reportar
          </NavLink>
          <NavLink to="/worker/ayuda" className={linkClass}>
            Ayuda
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
