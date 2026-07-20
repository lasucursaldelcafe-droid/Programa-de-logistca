import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { resolveRecipientUids } from "./pushRecipients";

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
