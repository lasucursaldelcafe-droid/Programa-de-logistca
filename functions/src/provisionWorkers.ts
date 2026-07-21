import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { mailConfigured, sendMail } from "./mail";
import { buildWorkerCredentialsEmail, resolveAppUrl } from "./emailTemplates";
import { db } from "./initAdmin";

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");
const speAppUrl = defineSecret("SPE_APP_URL");

const emailSecrets = [gmailUser, gmailAppPassword, speAppUrl];

const ADMIN_ROLES = new Set([
  "ceo",
  "master_app",
  "super_admin",
  "administrador",
  "recursos_humanos",
  "contador",
  "supervisor_sitio",
]);

const PLATFORM_CREATOR_ROLES = new Set(["ceo", "master_app", "super_admin", "administrador"]);

const PLATFORM_ACCOUNT_ROLES = new Set(["administrador", "recursos_humanos", "contador"]);

function normalizeDocumentPassword(documento: string): string {
  const normalized = documento.replace(/[\s.\-]/g, "").trim();
  if (normalized.length < 6) {
    throw new Error("El documento debe tener al menos 6 caracteres para usarlo como contraseña.");
  }
  return normalized;
}

async function assertAdmin(callerUid: string): Promise<void> {
  const snap = await db.collection("users").doc(callerUid).get();
  const role = snap.data()?.role as string | undefined;
  if (!role || !ADMIN_ROLES.has(role)) {
    throw new HttpsError("permission-denied", "Solo administradores pueden crear cuentas de personal.");
  }
}

async function sendCredentialsEmail(data: {
  workerNombre: string;
  email: string;
}): Promise<void> {
  const creds = {
    user: gmailUser.value(),
    pass: gmailAppPassword.value(),
    fromName: "SPE Negocio",
  };
  if (!mailConfigured(creds)) return;

  const appUrl = resolveAppUrl(speAppUrl.value());
  const { subject, text, html } = buildWorkerCredentialsEmail(
    { workerNombre: data.workerNombre, email: data.email },
    appUrl,
  );
  await sendMail(creds, { to: data.email, subject, text, html });
}

async function provisionOneWorker(
  workerId: string,
  options?: { sendEmail?: boolean },
): Promise<{ uid: string }> {
  const workerSnap = await db.collection("workers").doc(workerId).get();
  if (!workerSnap.exists) {
    throw new HttpsError("not-found", "Trabajador no encontrado.");
  }

  const worker = workerSnap.data()!;
  if (worker.cuentaCreada === true) {
    const existing = await db
      .collection("users")
      .where("workerId", "==", workerId)
      .limit(1)
      .get();
    if (!existing.empty) {
      return { uid: existing.docs[0]!.id };
    }
  }

  const email = String(worker.email ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    throw new HttpsError("failed-precondition", "El trabajador no tiene correo registrado.");
  }

  const password = normalizeDocumentPassword(String(worker.documento ?? ""));
  const rolPlataforma = (worker.rolPlataforma as string | undefined) ?? "trabajador";
  const perfilCompleto = rolPlataforma === "supervisor_sitio";

  const auth = getAuth();
  let uid: string;

  try {
    const created = await auth.createUser({
      email,
      password,
      displayName: String(worker.nombre ?? ""),
    });
    uid = created.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      await auth.updateUser(uid, { password, displayName: String(worker.nombre ?? "") });
    } else {
      const authCode = (err as { code?: string }).code ?? "";
      const message = err instanceof Error ? err.message : String(err);
      if (authCode === "auth/invalid-email") {
        throw new HttpsError("invalid-argument", "El correo no es válido.");
      }
      if (
        authCode === "auth/invalid-password" ||
        authCode === "auth/weak-password" ||
        /password/i.test(message)
      ) {
        throw new HttpsError(
          "invalid-argument",
          "El documento (contraseña) no es válido. Usa al menos 6 caracteres sin puntos ni espacios.",
        );
      }
      // Evitar code "internal": el cliente solo muestra "(internal)" y confunde al usuario.
      throw new HttpsError(
        "failed-precondition",
        message || "No se pudo crear la cuenta de acceso en Firebase Auth.",
      );
    }
  }

  const userRef = db.collection("users").doc(uid);
  const existingUser = await userRef.get();
  if (existingUser.exists) {
    const data = existingUser.data();
    if (data?.workerId && data.workerId !== workerId) {
      throw new HttpsError(
        "already-exists",
        "Este correo ya está vinculado a otro trabajador.",
      );
    }
  }

  await userRef.set(
    {
      email,
      nombre: String(worker.nombre ?? ""),
      role: rolPlataforma,
      workerId,
      customRoleId: worker.customRoleId ?? "",
      perfilCompleto,
      habilitado: worker.habilitado !== false,
    },
    { merge: true },
  );

  await workerSnap.ref.update({ cuentaCreada: true });

  if (options?.sendEmail !== false) {
    try {
      await sendCredentialsEmail({
        workerNombre: String(worker.nombre ?? ""),
        email,
      });
    } catch (err) {
      logger.warn("Correo de credenciales no enviado", {
        workerId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { uid };
}

/** Crea cuenta Auth (email + documento como contraseña) para un trabajador existente. */
export const provisionWorkerAccount = onCall(
  {
    region: "us-central1",
    secrets: emailSecrets,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    await assertAdmin(request.auth.uid);

    const workerId = String(request.data?.workerId ?? "").trim();
    if (!workerId) {
      throw new HttpsError("invalid-argument", "workerId requerido.");
    }

    const sendEmail = request.data?.sendEmail !== false;
    return provisionOneWorker(workerId, { sendEmail });
  },
);

/** Crea cuenta Auth para personal administrativo (sin ficha de trabajador). */
export const createPlatformAccountFn = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const callerSnap = await db.collection("users").doc(request.auth.uid).get();
    const callerRole = callerSnap.data()?.role as string | undefined;
    if (!callerRole || !PLATFORM_CREATOR_ROLES.has(callerRole)) {
      throw new HttpsError("permission-denied", "No puedes crear cuentas administrativas.");
    }

    const email = String(request.data?.email ?? "").trim().toLowerCase();
    const nombre = String(request.data?.nombre ?? "").trim();
    const password = String(request.data?.password ?? "");
    const role = String(request.data?.role ?? "").trim();

    if (!email || !nombre || password.length < 6) {
      throw new HttpsError("invalid-argument", "Nombre, correo y contraseña (mín. 6) requeridos.");
    }
    if (!PLATFORM_ACCOUNT_ROLES.has(role)) {
      throw new HttpsError("invalid-argument", "Rol administrativo no válido.");
    }
    if (callerRole === "administrador" && role === "administrador") {
      throw new HttpsError("permission-denied", "Solo CEO o Master App pueden crear otro Administrador.");
    }

    const auth = getAuth();
    let uid: string;
    try {
      const created = await auth.createUser({ email, password, displayName: nombre });
      uid = created.uid;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "Ya existe una cuenta con ese correo.");
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpsError(
        "failed-precondition",
        message || "No se pudo crear la cuenta administrativa en Firebase Auth.",
      );
    }

    await db.collection("users").doc(uid).set({
      email,
      nombre,
      role,
      workerId: null,
      perfilCompleto: true,
      habilitado: true,
      creadoPor: request.auth.uid,
      creadoPorNombre: callerSnap.data()?.nombre ?? "",
    });

    return { uid };
  },
);

interface BulkRowInput {
  nombre: string;
  documento: string;
  email: string;
  telefono?: string;
  perfiles?: string[];
  rolPlataforma?: string;
  customRoleId?: string;
}

/** Registra trabajadores en lote y crea sus cuentas (email = usuario, documento = clave). */
export const importWorkersBulk = onCall(
  {
    region: "us-central1",
    secrets: emailSecrets,
    timeoutSeconds: 540,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    await assertAdmin(request.auth.uid);

    const rows = request.data?.rows as BulkRowInput[] | undefined;
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new HttpsError("invalid-argument", "Se requiere al menos una fila.");
    }
    if (rows.length > 200) {
      throw new HttpsError("invalid-argument", "Máximo 200 filas por importación.");
    }

    const sendEmail = request.data?.sendEmail !== false;
    const results: Array<{
      email: string;
      nombre: string;
      ok: boolean;
      workerId?: string;
      error?: string;
    }> = [];

    for (const row of rows) {
      const email = String(row.email ?? "")
        .trim()
        .toLowerCase();
      const nombre = String(row.nombre ?? "").trim();
      const documento = String(row.documento ?? "").trim();

      try {
        if (!nombre || !documento || !email) {
          throw new Error("Fila incompleta (nombre, documento, email).");
        }
        normalizeDocumentPassword(documento);

        const rolPlataforma = (row.rolPlataforma as string | undefined) ?? "trabajador";
        const perfiles = Array.isArray(row.perfiles) && row.perfiles.length > 0
          ? row.perfiles
          : ["logistica"];

        const workerRef = await db.collection("workers").add({
          nombre,
          documento,
          telefono: String(row.telefono ?? ""),
          email,
          perfiles,
          rolPlataforma,
          customRoleId: row.customRoleId ?? "",
          experienciaAnios: 0,
          eventosTrabajados: 0,
          rating: 0,
          estado: "sin_asignar",
          cuentaCreada: false,
          habilitado: true,
          certificaciones: [],
          creadoEn: new Date().toISOString(),
          importadoEn: FieldValue.serverTimestamp(),
          importadoPor: request.auth.uid,
        });

        const { uid } = await provisionOneWorker(workerRef.id, { sendEmail });

        results.push({ email, nombre, ok: true, workerId: workerRef.id });
        logger.info("Trabajador importado", { workerId: workerRef.id, uid, email });
      } catch (err) {
        results.push({
          email,
          nombre,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const created = results.filter((r) => r.ok).length;
    return {
      created,
      failed: results.length - created,
      results,
    };
  },
);
