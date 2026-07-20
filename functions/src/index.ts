import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { resolveRecipientUids, resolveChatRecipientUids, comunicacionLinkForUid } from "./pushRecipients";

initializeApp();

const db = getFirestore();

export const onNotificationCreated = onDocumentCreated(
  {
    document: "notifications/{notificationId}",
    region: "us-central1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const notificationId = event.params.notificationId;
    const data = snap.data();
    const titulo = (data.titulo as string | undefined)?.trim() || "Personal Eventos";
    const mensaje = (data.mensaje as string | undefined)?.trim() || "";
    const urgente = data.urgente === true;

    try {
      const uids = await resolveRecipientUids(db, {
        destinatarios: data.destinatarios as string[] | undefined,
        eventId: data.eventId as string | undefined,
        siteId: data.siteId as string | undefined,
      });

      if (uids.length === 0) {
        await snap.ref.update({
          pushEnviadoEn: FieldValue.serverTimestamp(),
          pushTokensEnviados: 0,
          pushError: "Sin destinatarios con token FCM",
        });
        return;
      }

      const tokens: string[] = [];
      for (const uid of uids) {
        const tokenDoc = await db.collection("fcmTokens").doc(uid).get();
        const token = tokenDoc.data()?.token as string | undefined;
        if (token?.trim()) tokens.push(token.trim());
      }

      if (tokens.length === 0) {
        await snap.ref.update({
          pushEnviadoEn: FieldValue.serverTimestamp(),
          pushTokensEnviados: 0,
          pushError: "Destinatarios sin token push registrado",
        });
        return;
      }

      const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: {
          title: titulo,
          body: mensaje,
        },
        data: {
          notificationId,
          tipo: String(data.tipo ?? "sistema"),
          urgente: urgente ? "1" : "0",
        },
        webpush: {
          notification: {
            icon: "/favicon.ico",
            requireInteraction: urgente,
          },
          fcmOptions: {
            link: "/notificaciones",
          },
        },
      });

      const successCount = response.successCount;
      const failCount = response.failureCount;
      const errors = response.responses
        .map((r, i) => (r.success ? null : `${tokens[i]}: ${r.error?.message ?? "error"}`))
        .filter(Boolean)
        .slice(0, 3)
        .join("; ");

      await snap.ref.update({
        pushEnviadoEn: FieldValue.serverTimestamp(),
        pushTokensEnviados: successCount,
        ...(failCount > 0 && errors ? { pushError: errors } : { pushError: FieldValue.delete() }),
      });

      logger.info("FCM push enviado", {
        notificationId,
        successCount,
        failCount,
        destinatarios: uids.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("FCM push falló", { notificationId, message });
      await snap.ref.update({
        pushError: message.slice(0, 500),
      });
    }
  },
);

export const onChatMessageCreated = onDocumentCreated(
  {
    document: "chatMessages/{messageId}",
    region: "us-central1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const messageId = event.params.messageId;
    const data = snap.data();
    const senderUid = data.senderUid as string;
    const senderNombre = (data.senderNombre as string | undefined)?.trim() || "Equipo";
    const text = (data.text as string | undefined)?.trim() || "";
    const channelLabel = (data.channelLabel as string | undefined)?.trim() || "Chat";
    const channelId = data.channelId as string;

    if (!senderUid || !text) return;

    try {
      const uids = await resolveChatRecipientUids(db, {
        channelId,
        eventId: data.eventId as string | null | undefined,
        senderUid,
      });

      if (uids.length === 0) {
        logger.info("Chat sin destinatarios push", { messageId, channelId });
        return;
      }

      const recipients: Array<{ uid: string; token: string }> = [];
      for (const uid of uids) {
        const tokenDoc = await db.collection("fcmTokens").doc(uid).get();
        const token = tokenDoc.data()?.token as string | undefined;
        if (token?.trim()) recipients.push({ uid, token: token.trim() });
      }

      if (recipients.length === 0) {
        logger.info("Chat sin tokens FCM", { messageId, channelId, uids: uids.length });
        return;
      }

      const title = `${senderNombre} · ${channelLabel}`;
      const body = text.length > 200 ? `${text.slice(0, 197)}…` : text;

      const messages = await Promise.all(
        recipients.map(async (r) => ({
          token: r.token,
          notification: { title, body },
          data: {
            tipo: "chat",
            channelId,
            messageId,
          },
          webpush: {
            notification: { icon: "/favicon.ico" },
            fcmOptions: {
              link: await comunicacionLinkForUid(db, r.uid),
            },
          },
        })),
      );

      const response = await getMessaging().sendEach(messages);

      logger.info("FCM chat push enviado", {
        messageId,
        channelId,
        successCount: response.successCount,
        failCount: response.failureCount,
        destinatarios: recipients.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("FCM chat push falló", { messageId, message });
    }
  },
);
