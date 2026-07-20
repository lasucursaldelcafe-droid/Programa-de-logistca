/**
 * Verifica que los documentos QR se construyen sin undefined (Firestore-safe)
 * y, si el emulador está activo, que acepta escrituras por_jornada.
 */
import net from "node:net";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  assertFirestoreSafe,
  buildQrCodeDocument,
  buildQrCodeId,
  buildQrCodeToken,
  type CreateQrCodeInput,
} from "@spe/shared";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function canReachEmulator(host = "127.0.0.1", port = 8080): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 800 }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const BASE_INPUT: CreateQrCodeInput = {
  eventId: "event-test",
  eventNombre: "Evento prueba",
  siteId: "site-test-1",
  siteNombre: "Sitio prueba",
  modo: "por_jornada",
  ventanaInicio: new Date().toISOString(),
  ventanaFin: new Date(Date.now() + 86_400_000).toISOString(),
  radioGeocerca: 80,
  descripcionDatos: "Consentimiento GPS de prueba.",
  creadoPor: "admin-uid-test",
};

function testPayloads(): void {
  const porJornada = buildQrCodeDocument(BASE_INPUT, {
    token: buildQrCodeToken("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
  });
  assert(porJornada.modo === "por_jornada", "modo por_jornada");
  assert(!("secret" in porJornada), "por_jornada no debe incluir secret");
  assert(!("intervaloRotacionSegundos" in porJornada), "por_jornada sin intervalo");
  assertFirestoreSafe(porJornada);

  const rotativo = buildQrCodeDocument(
    { ...BASE_INPUT, modo: "rotativo", intervaloRotacionSegundos: 30 },
    { token: buildQrCodeToken("11111111-2222-3333-4444-555555555555"), secret: "abc12345" },
  );
  assert(rotativo.secret === "abc12345", "rotativo incluye secret");
  assert(rotativo.intervaloRotacionSegundos === 30, "rotativo incluye intervalo");
  assertFirestoreSafe(rotativo);

  const unico = buildQrCodeDocument(
    { ...BASE_INPUT, modo: "unico" },
    { token: buildQrCodeToken("99999999-8888-7777-6666-555555555555") },
  );
  assert(!("secret" in unico), "unico no debe incluir secret");
  assertFirestoreSafe(unico);

  console.log("✓ Payloads QR Firestore-safe (por_jornada, rotativo, unico)");
}

async function testEmulatorWrite(): Promise<void> {
  const reachable = await canReachEmulator();
  if (!reachable) {
    console.warn("⚠ Emulador Firestore no disponible; solo prueba de payloads.");
    return;
  }

  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  const projectId = "demo-personal-eventos";

  if (!getApps().length) {
    initializeApp({ projectId });
  }

  const db = getFirestore();
  const siteId = `site-verify-${Date.now().toString(36)}`;
  const id = buildQrCodeId(siteId);
  const doc = buildQrCodeDocument(
    { ...BASE_INPUT, siteId },
    { token: buildQrCodeToken(crypto.randomUUID()) },
  );

  await db.collection("qrCodes").doc(id).set(doc);
  const snap = await db.collection("qrCodes").doc(id).get();
  assert(snap.exists, "documento QR debe existir en emulador");
  const data = snap.data();
  assert(data?.token === doc.token, "token persistido");
  assert(data?.siteId === siteId, "siteId persistido");
  assert(!Object.values(data ?? {}).includes(undefined), "sin undefined en Firestore");

  await db.collection("qrCodes").doc(id).delete();
  console.log("✓ Escritura QR por_jornada OK en emulador Firestore");
}

async function main(): Promise<void> {
  testPayloads();
  await testEmulatorWrite();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
