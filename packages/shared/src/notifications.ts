import type { AppNotification, AppUser } from "./types";

export function notificationVisibleTo(
  notification: AppNotification,
  user: AppUser,
): boolean {
  const dest = notification.destinatarios;
  if (dest.includes("_todos")) return true;
  if (dest.includes("_admins") && user.role !== "trabajador") return true;
  if (user.workerId && dest.includes(user.workerId)) return true;
  if (notification.eventId && dest.includes(`event:${notification.eventId}`)) return true;
  if (notification.siteId && dest.includes(`site:${notification.siteId}`)) return true;
  return false;
}

export function notificationUnreadFor(
  notification: AppNotification,
  uid: string,
): boolean {
  return !notification.leidaPor.includes(uid);
}
