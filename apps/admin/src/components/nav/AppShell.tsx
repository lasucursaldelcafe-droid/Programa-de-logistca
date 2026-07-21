import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ROLE_LABEL } from "@spe/shared";
import type { AppUser } from "@spe/shared";
import type { NavSection } from "../../config/navigation";
import { NotificationBell } from "../NotificationBell";
import { WelcomeModal } from "../WelcomeModal";
import { ChatBubble } from "../comunicacion/ChatBubble";
import { NavIcon } from "./NavIcons";
import { SidebarNav } from "./SidebarNav";

interface AppShellProps {
  user: AppUser;
  brand: string;
  brandSub?: string;
  sections: NavSection[];
  onLogout: () => Promise<void>;
}

export function AppShell({ user, brand, brandSub, sections, onLogout }: AppShellProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh spe-app-bg safe-area-px lg:flex">
      <WelcomeModal user={user} />
      {/* Sidebar — desktop / tablet landscape */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/80 bg-gradient-to-b from-surface-elevated via-surface to-bg lg:flex xl:w-60">
        <BrandBlock brand={brand} brandSub={brandSub} />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav sections={sections} />
        </div>
        <UserFooter user={user} onLogout={onLogout} navigate={navigate} />
      </aside>

      {/* Mobile / tablet drawer */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-surface transition-transform safe-area-pt safe-area-pb lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <BrandBlock brand={brand} brandSub={brandSub} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav sections={sections} onNavigate={() => setMobileOpen(false)} />
        </div>
        <UserFooter user={user} onLogout={onLogout} navigate={navigate} />
      </aside>

      {/* Main */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border/80 bg-bg/85 px-3 py-2.5 backdrop-blur-md safe-area-pt sm:gap-3 sm:px-4 sm:py-3 lg:px-8">
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-neutral-300 hover:bg-neutral-800 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <NavIcon name="menu" />
            <span className="hidden font-medium min-[380px]:inline">Menú</span>
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate font-display text-sm font-semibold">{brand}</p>
            <p className="truncate text-xs text-neutral-500">{user.nombre}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={async () => {
                await onLogout();
                navigate("/login");
              }}
              className="rounded-lg px-2.5 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden"
            >
              Salir
            </button>
          </div>
        </header>
        <main className="spe-animate-in flex-1 px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
          <div className="spe-page-wide min-w-0">
            <Outlet />
          </div>
        </main>
        <ChatBubble />
      </div>
    </div>
  );
}

function BrandBlock({
  brand,
  brandSub,
  onClose,
}: {
  brand: string;
  brandSub?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-border px-4 py-4">
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-semibold tracking-tight text-white">{brand}</p>
        {brandSub && <p className="mt-0.5 truncate text-xs text-neutral-500">{brandSub}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-neutral-500 hover:text-white"
          aria-label="Cerrar"
        >
          <NavIcon name="close" />
        </button>
      )}
    </div>
  );
}

function UserFooter({
  user,
  onLogout,
  navigate,
}: {
  user: AppUser;
  onLogout: () => Promise<void>;
  navigate: (path: string) => void;
}) {
  return (
    <div className="border-t border-border p-4">
      <p className="truncate text-sm font-medium text-neutral-200">{user.nombre}</p>
      <p className="truncate text-xs text-neutral-500">{ROLE_LABEL[user.role]}</p>
      <button
        type="button"
        onClick={async () => {
          await onLogout();
          navigate("/login");
        }}
        className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm text-neutral-400 transition hover:border-neutral-600 hover:text-white"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
