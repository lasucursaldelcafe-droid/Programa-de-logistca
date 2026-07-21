import { NavLink } from "react-router-dom";
import { notificationsPath } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { useUnreadCount } from "../hooks/useNotifications";
import { NavIcon } from "./nav/NavIcons";

interface NotificationBellProps {
  /** Compacto para headers estrechos (worker / móvil). */
  compact?: boolean;
}

export function NotificationBell({ compact = false }: NotificationBellProps) {
  const { user } = useAuth();
  const unread = useUnreadCount(user);

  if (!user) return null;

  return (
    <NavLink
      to={notificationsPath(user.role)}
      aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : "Notificaciones"}
      title="Notificaciones"
      className={`relative inline-flex items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-800 hover:text-white ${
        compact ? "min-h-11 min-w-11" : "gap-2 px-3 py-2 text-sm font-medium"
      }`}
    >
      <NavIcon name="bell" className="h-5 w-5" />
      {!compact && <span className="hidden sm:inline">Notificaciones</span>}
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </NavLink>
  );
}
