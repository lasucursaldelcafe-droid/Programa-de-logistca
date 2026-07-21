import { Outlet, Link, useNavigate } from "react-router-dom";
import { ROLE_LABEL } from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { NotificationBell } from "@core/components/NotificationBell";
import { WelcomeModal } from "@core/components/WelcomeModal";
import { WorkerBottomNav } from "@core/components/nav/WorkerBottomNav";

export function WorkerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-bg pb-[calc(5rem+env(safe-area-inset-bottom,0px))] safe-area-px">
      <WelcomeModal user={user} />
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur safe-area-pt">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-3 py-3 sm:px-4 md:max-w-2xl lg:max-w-3xl">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold">App Trabajador</p>
            <p className="truncate text-xs text-neutral-500">
              {user.nombre} · {ROLE_LABEL[user.role]}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            <Link
              to="/worker/ayuda"
              className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
              title="Ayuda"
            >
              Ayuda
            </Link>
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
      <main className="mx-auto w-full max-w-lg px-3 py-5 sm:px-4 sm:py-6 md:max-w-2xl lg:max-w-3xl">
        <Outlet />
      </main>
      <WorkerBottomNav />
    </div>
  );
}
