import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ROLE_LABEL, puedeGestionarPersonal } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-accent/15 text-accent"
      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
  }`;

const sectionClass = "px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = puedeGestionarPersonal(user.role);

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface/50 md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <div className="font-display text-base font-bold text-accent">SPE Negocio</div>
          <div className="text-[11px] text-neutral-500">Estilo Siigo · Personal + ERP</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          <div className={sectionClass}>Negocio</div>
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/clientes" className={linkClass}>
                Clientes
              </NavLink>
              <NavLink to="/facturacion" className={linkClass}>
                Facturación
              </NavLink>
              <NavLink to="/inventario" className={linkClass}>
                Inventario
              </NavLink>
            </>
          )}
          <div className={sectionClass}>Personal</div>
          {isAdmin && (
            <NavLink to="/personal" className={linkClass}>
              Trabajadores
            </NavLink>
          )}
          <NavLink to="/turnos" className={linkClass}>
            Turnos
          </NavLink>
          <NavLink to="/supervision" className={linkClass}>
            Supervisión en vivo
          </NavLink>
          <div className={sectionClass}>Conexiones</div>
          <NavLink to="/integraciones" className={linkClass}>
            APIs e integraciones
          </NavLink>
        </nav>
        <div className="border-t border-border p-3 text-xs text-neutral-500">
          {user.nombre}
          <br />
          {ROLE_LABEL[user.role]}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 md:hidden">
          <span className="font-display font-semibold">SPE Negocio</span>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="text-sm text-neutral-400"
          >
            Salir
          </button>
        </header>
        <header className="hidden items-center justify-between border-b border-border bg-surface/80 px-6 py-3 md:flex">
          <span className="text-sm text-neutral-400">
            Plataforma unificada — contabilidad, personal y supervisión
          </span>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
          >
            Cerrar sesión
          </button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
