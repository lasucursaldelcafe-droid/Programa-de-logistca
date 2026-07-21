import { getAuth } from "firebase-admin/auth";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "./initAdmin";

function normalizeDocumentPassword(documento: string): string {
  const normalized = documento.replace(/[\s.\-]/g, "").trim();
  if (normalized.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "La cédula/documento debe tener al menos 6 caracteres (sin puntos ni espacios).",
    );
  }
  return normalized;
}

function getRotatingToken(
  qrId: string,
  secret: string,
  intervalSeconds: number,
  nowMs = Date.now(),
): string {
  const slot = Math.floor(nowMs / (intervalSeconds * 1000));
  const raw = `${qrId}:${secret}:${slot}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, "0").slice(0, 12);
}

function resolveQrToken(qr: DocumentData, qrId: string, token: string): boolean {
  if (qr.activo === false) return false;
  if (qr.modo === "rotativo" && qr.secret && qr.intervaloRotacionSegundos) {
    const expected = getRotatingToken(
      qrId,
      String(qr.secret),
      Number(qr.intervaloRotacionSegundos),
    );
    return token === expected;
  }
  return token === String(qr.token ?? "");
}

async function loadValidQr(qrId: string, token: string): Promise<DocumentData & { id: string }> {
  const snap = await db.collection("qrCodes").doc(qrId).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Código QR no encontrado.");
  }
  const qr = snap.data()!;
  if (!resolveQrToken(qr, qrId, token)) {
    throw new HttpsError("failed-precondition", "Token QR inválido o expirado.");
  }
  return { id: snap.id, ...qr };
}

/** Vista previa pública del sitio (sin crear cuenta). */
export const resolveSiteQr = onCall({ region: "us-central1" }, async (request) => {
  const qrId = String(request.data?.qrId ?? "").trim();
  const token = String(request.data?.token ?? "").trim();
  if (!qrId || !token) {
    throw new HttpsError("invalid-argument", "qrId y token requeridos.");
  }
  const qr = await loadValidQr(qrId, token);
  return {
    qrId: qr.id,
    siteId: String(qr.siteId ?? ""),
    siteNombre: String(qr.siteNombre ?? ""),
    eventId: String(qr.eventId ?? ""),
    eventNombre: String(qr.eventNombre ?? ""),
    ventanaInicio: String(qr.ventanaInicio ?? ""),
    ventanaFin: String(qr.ventanaFin ?? ""),
    descripcionDatos: String(qr.descripcionDatos ?? ""),
  };
});

/**
 * Alta por QR de sitio:
 * - Crea Auth (clave = cédula)
 * - Crea worker + users/{uid}
 * - Asigna puesto (turno confirmado en el sitio)
 * - Notifica a administradores/CEO para configurar perfiles
 */
export const onboardFromSiteQr = onCall({ region: "us-central1" }, async (request) => {
  const qrId = String(request.data?.qrId ?? "").trim();
  const token = String(request.data?.token ?? "").trim();
  const nombre = String(request.data?.nombre ?? "").trim();
  const documentoRaw = String(request.data?.documento ?? "").trim();
  const email = String(request.data?.email ?? "")
    .trim()
    .toLowerCase();
  const telefono = String(request.data?.telefono ?? "").trim();

  if (!qrId || !token || !nombre || !documentoRaw || !email) {
    throw new HttpsError(
      "invalid-argument",
      "Completa nombre, documento, correo y el código QR del sitio.",
    );
  }

  const password = normalizeDocumentPassword(documentoRaw);
  const qr = await loadValidQr(qrId, token);

  const auth = getAuth();
  let uid: string;
  try {
    const created = await auth.createUser({
      email,
      password,
      displayName: nombre,
    });
    uid = created.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      await auth.updateUser(uid, { password, displayName: nombre });
    } else if (code === "auth/invalid-email") {
      throw new HttpsError("invalid-argument", "El correo no es válido.");
    } else {
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpsError(
        "failed-precondition",
        message || "No se pudo crear la cuenta de acceso.",
      );
    }
  }

  const userRef = db.collection("users").doc(uid);
  const existingUser = await userRef.get();
  let workerId =
    typeof existingUser.data()?.workerId === "string"
      ? String(existingUser.data()!.workerId)
      : "";

  if (existingUser.exists) {
    const role = existingUser.data()?.role as string | undefined;
    if (role && role !== "trabajador" && role !== "supervisor_sitio") {
      throw new HttpsError(
        "already-exists",
        "Este correo ya pertenece a una cuenta administrativa. Usa otro correo.",
      );
    }
  }

  if (!workerId) {
    const workerRef = await db.collection("workers").add({
      nombre,
      documento: documentoRaw,
      telefono,
      email,
      perfiles: ["logistica"],
      rolPlataforma: "trabajador",
      customRoleId: "",
      experienciaAnios: 0,
      eventosTrabajados: 0,
      rating: 0,
      estado: "sin_asignar",
      cuentaCreada: true,
      habilitado: true,
      certificaciones: [],
      creadoEn: new Date().toISOString(),
      origenAlta: "qr_sitio",
      qrId,
      siteIdAlta: String(qr.siteId ?? ""),
      eventIdAlta: String(qr.eventId ?? ""),
    });
    workerId = workerRef.id;
  } else {
    await db.collection("workers").doc(workerId).set(
      {
        nombre,
        documento: documentoRaw,
        telefono,
        email,
        cuentaCreada: true,
        habilitado: true,
      },
      { merge: true },
    );
  }

  await userRef.set(
    {
      email,
      nombre,
      telefono,
      role: "trabajador",
      workerId,
      customRoleId: "",
      perfilCompleto: false,
      habilitado: true,
    },
    { merge: true },
  );

  // Puesto de trabajo: turno confirmado en el sitio del QR
  const now = new Date();
  const ventanaInicio = new Date(String(qr.ventanaInicio || now.toISOString()));
  const ventanaFin = new Date(String(qr.ventanaFin || now.toISOString()));
  const inicio = now > ventanaInicio ? now : ventanaInicio;
  const fin =
    ventanaFin > inicio
      ? ventanaFin
      : new Date(inicio.getTime() + 8 * 60 * 60 * 1000);

  const existingShifts = await db
    .collection("shifts")
    .where("workerId", "==", workerId)
    .where("siteId", "==", String(qr.siteId ?? ""))
    .limit(10)
    .get();

  let shiftId = "";
  const openShift = existingShifts.docs.find((d) => {
    const estado = d.data().estado;
    return estado === "confirmado" || estado === "pendiente";
  });
  if (openShift) {
    shiftId = openShift.id;
    if (openShift.data().estado !== "confirmado") {
      await openShift.ref.update({ estado: "confirmado" });
    }
  } else {
    const shiftRef = await db.collection("shifts").add({
      workerId,
      workerNombre: nombre,
      siteId: String(qr.siteId ?? ""),
      siteNombre: String(qr.siteNombre ?? ""),
      eventId: String(qr.eventId ?? ""),
      eventNombre: String(qr.eventNombre ?? ""),
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      estado: "confirmado",
      creadoEn: FieldValue.serverTimestamp(),
      origenAlta: "qr_sitio",
      qrId,
    });
    shiftId = shiftRef.id;
  }

  await db.collection("notifications").add({
    tipo: "alta_qr",
    titulo: "Nueva persona por QR — configurar perfiles",
    mensaje:
      `${nombre} (${email}) se registró con el QR de «${qr.siteNombre}»` +
      ` en el evento «${qr.eventNombre}». ` +
      `Ya tiene puesto asignado en el sitio. Revisa Personal / Roles para configurar perfiles y permisos.`,
    timestamp: new Date().toISOString(),
    urgente: true,
    destinatarios: ["_admins"],
    eventId: String(qr.eventId ?? ""),
    siteId: String(qr.siteId ?? ""),
    shiftId,
    actorUid: uid,
    actorNombre: nombre,
    leidaPor: [],
    accionTurno: false,
  });

  logger.info("Onboarding por QR", {
    uid,
    workerId,
    shiftId,
    qrId,
    email,
  });

  return {
    uid,
    workerId,
    shiftId,
    email,
    siteNombre: String(qr.siteNombre ?? ""),
    eventNombre: String(qr.eventNombre ?? ""),
    passwordIsDocumento: true as const,
  };
});
