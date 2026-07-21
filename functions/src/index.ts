import { FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { db } from "./initAdmin";
import { resolveRecipientUids, resolveChatRecipientUids, comunicacionLinkForUid } from "./pushRecipients";
import { mailConfigured, sendMail } from "./mail";
import { buildInvitationEmail, buildShiftAssignedEmail, resolveAppUrl } from "./emailTemplates";
export { provisionWorkerAccount, importWorkersBulk, createPlatformAccountFn } from "./provisionWorkers";
export { resolveSiteQr, onboardFromSiteQr } from "./onboardFromQr";

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");
const speAppUrl = defineSecret("SPE_APP_URL");

const emailSecrets = [gmailUser, gmailAppPassword, speAppUrl];

function mailCredentials() {
  return {
    user: gmailUser.value(),
    pass: gmailAppPassword.value(),
    fromName: "SPE Negocio",
  };
}

export const onInvitationCreated = onDocumentCreated(
  {
    document: "invitations/{token}",
    region: "us-central1",
    secrets: emailSecrets,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const token = event.params.token;
    const data = snap.data();
    if (data.estado !== "pendiente") return;
    if (data.emailEnviadoEn) return;

    const creds = mailCredentials();
    if (!mailConfigured(creds)) {
      const message = "Correo no configurado (GMAIL_USER / GMAIL_APP_PASSWORD)";
      logger.warn(message, { token });
      await snap.ref.update({ emailError: message });
      return;
    }

    const email = String(data.email ?? "").trim().toLowerCase();
    if (!email) {
      await snap.ref.update({ emailError: "Invitación sin correo destino" });
      return;
    }

    try {
      const appUrl = resolveAppUrl(speAppUrl.value());
      const { subject, text, html } = buildInvitationEmail(
        {
          workerNombre: String(data.workerNombre ?? "Equipo"),
          email,
          codigoAcceso: String(data.codigoAcceso ?? ""),
          expiraEn: String(data.expiraEn ?? ""),
          role: data.role as string | undefined,
          token,
        },
        appUrl,
      );

      await sendMail(creds, { to: email, subject, text, html });
      await snap.ref.update({
        emailEnviadoEn: new Date().toISOString(),
        emailError: FieldValue.delete(),
      });
      logger.info("Correo de invitación enviado", { token, email });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Correo de invitación falló", { token, message });
      await snap.ref.update({ emailError: message.slice(0, 500) });
    }
  },
);

export const onShiftCreated = onDocumentCreated(
  {
    document: "shifts/{shiftId}",
    region: "us-central1",
    secrets: emailSecrets,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const shiftId = event.params.shiftId;
    const data = snap.data();
    const workerId = String(data.workerId ?? "");
    if (!workerId) return;

    const creds = mailCredentials();
    if (!mailConfigured(creds)) {
      logger.warn("Turno creado sin correo SMTP configurado", { shiftId });
      return;
    }

    try {
      const workerSnap = await db.collection("workers").doc(workerId).get();
      const worker = workerSnap.data();
      const email = String(worker?.email ?? "").trim().toLowerCase();
      if (!email) {
        logger.info("Turno sin correo de trabajador", { shiftId, workerId });
        return;
      }

      const appUrl = resolveAppUrl(speAppUrl.value());
      const { subject, text, html } = buildShiftAssignedEmail(
        {
          workerNombre: String(data.workerNombre ?? worker?.nombre ?? ""),
          eventNombre: data.eventNombre as string | undefined,
          siteNombre: data.siteNombre as string | undefined,
          inicio: String(data.inicio ?? ""),
          fin: String(data.fin ?? ""),
        },
        appUrl,
      );

      await sendMail(creds, { to: email, subject, text, html });
      await snap.ref.update({
        emailTurnoEnviadoEn: new Date().toISOString(),
      });
      logger.info("Correo de turno enviado", { shiftId, email });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Correo de turno falló", { shiftId, message });
    }
  },
);

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
        audience: data.audience as string | null | undefined,
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
