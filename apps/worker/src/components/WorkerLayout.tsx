import { Outlet, Link, useNavigate } from "react-router-dom";
import { ROLE_LABEL } from "@spe/shared";
import { useAuth } from "@core/contexts/AuthContext";
import { FieldGpsProvider, useFieldGps } from "@core/contexts/FieldGpsContext";
import { NotificationBell } from "@core/components/NotificationBell";
import { WelcomeModal } from "@core/components/WelcomeModal";
import { EnablePushBanner } from "@core/components/EnablePushBanner";
import { WorkerBottomNav } from "@core/components/nav/WorkerBottomNav";
import { NavIcon } from "@core/components/nav/NavIcons";

function GpsTrackingHint() {
  const { tracking, gpsError } = useFieldGps();
  if (!tracking) return null;

  const denied =
    Boolean(gpsError) &&
    /denied|permission|permiso|bloquead/i.test(gpsError ?? "");

  return (
    <div
      className={`border-b px-3 py-2 text-center text-xs leading-snug ${
        gpsError
          ? "border-alert/40 bg-alert/10 text-alert"
          : "border-positive/30 bg-positive/10 text-positive"
      }`}
    >
      {gpsError
        ? denied
          ? "GPS bloqueado. Actívalo en Ajustes del teléfono → Apps → SPE Eventos → Ubicación."
          : `GPS: ${gpsError}`
        : "GPS activo — tu ubicación se actualiza aunque cambies de pantalla"}
    </div>
  );
}

export function WorkerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <FieldGpsProvider>
      <div className="min-h-dvh bg-bg pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] safe-area-px">
        <WelcomeModal user={user} />
        <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur safe-area-pt">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-1 px-2 py-2 sm:gap-2 sm:px-4 md:max-w-2xl lg:max-w-3xl">
            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate font-display text-sm font-semibold">App Trabajador</p>
              <p className="truncate text-xs text-neutral-500">
                {user.nombre} · {ROLE_LABEL[user.role]}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <NotificationBell compact />
              <Link
                to="/worker/ayuda"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
                title="Ayuda"
                aria-label="Ayuda"
              >
                <NavIcon name="help" className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
                title="Salir"
                aria-label="Salir"
              >
                <NavIcon name="logout" className="h-5 w-5" />
              </button>
            </div>
          </div>
          <GpsTrackingHint />
          <EnablePushBanner />
        </header>
        <main className="mx-auto w-full max-w-lg px-3 py-5 sm:px-4 sm:py-6 md:max-w-2xl lg:max-w-3xl">
          <Outlet />
        </main>
        <WorkerBottomNav />
      </div>
    </FieldGpsProvider>
  );
}
