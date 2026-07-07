import { NavLink } from "react-router-dom";
import { notificationsPath } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { useUnreadCount } from "../hooks/useNotifications";

export function NotificationBell() {
  const { user } = useAuth();
  const unread = useUnreadCount(user);

  if (!user) return null;

  return (
    <NavLink
      to={notificationsPath(user.role)}
      className="relative rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
    >
      Notificaciones
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </NavLink>
  );
}
