import type { AppNotification, AppUser } from "./types";

export function notificationVisibleTo(
  notification: AppNotification,
  user: AppUser,
): boolean {
  // No mostrar al autor su propia alerta de chat (la campana no debe auto-notificarse).
  if (
    notification.tipo === "chat_mensaje" &&
    notification.actorUid &&
    notification.actorUid === user.uid
  ) {
    return false;
  }
  const dest = Array.isArray(notification.destinatarios)
    ? notification.destinatarios
    : [];
  if (dest.includes("_todos")) return true;
  if (dest.includes("_admins") && user.role !== "trabajador") return true;
  // Chat / alertas dirigidas al Auth UID
  if (dest.includes(user.uid)) return true;
  if (user.workerId && dest.includes(user.workerId)) return true;
  if (notification.eventId && dest.includes(`event:${notification.eventId}`)) return true;
  if (notification.siteId && dest.includes(`site:${notification.siteId}`)) return true;
  return false;
}

export function notificationUnreadFor(
  notification: AppNotification,
  uid: string,
): boolean {
  const leida = Array.isArray(notification.leidaPor) ? notification.leidaPor : [];
  return !leida.includes(uid);
}
