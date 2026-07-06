import { Outlet, useNavigate } from "react-router-dom";
import { ROLE_LABEL } from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { NotificationBell } from "@core/components/NotificationBell";
import { WorkerBottomNav } from "@core/components/nav/WorkerBottomNav";

export function WorkerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold">App Trabajador</p>
            <p className="truncate text-xs text-neutral-500">
              {user.nombre} · {ROLE_LABEL[user.role]}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">
        <Outlet />
      </main>
      <WorkerBottomNav />
    </div>
  );
}
