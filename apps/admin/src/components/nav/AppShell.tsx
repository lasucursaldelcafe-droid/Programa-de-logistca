import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ROLE_LABEL } from "@spe/shared";
import type { AppUser } from "@spe/shared";
import type { NavSection } from "../../config/navigation";
import { NotificationBell } from "../NotificationBell";
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
    <div className="min-h-screen bg-bg lg:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-gradient-to-b from-surface to-bg lg:flex">
        <BrandBlock brand={brand} brandSub={brandSub} />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav sections={sections} />
        </div>
        <UserFooter user={user} onLogout={onLogout} navigate={navigate} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:hidden ${
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
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <NavIcon name="menu" />
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate font-display text-sm font-semibold">{brand}</p>
            <p className="truncate text-xs text-neutral-500">{user.nombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={async () => {
                await onLogout();
                navigate("/login");
              }}
              className="hidden rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white sm:block lg:hidden"
            >
              Salir
            </button>
          </div>
        </header>
        <main className="flex-1 px-3 py-4 lg:px-6 lg:py-5">
          <Outlet />
        </main>
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
      <div>
        <p className="font-display text-lg font-semibold tracking-tight text-white">{brand}</p>
        {brandSub && <p className="mt-0.5 text-xs text-neutral-500">{brandSub}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-500 hover:text-white"
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
