import { parseQrPayload, formatQrPayload } from "@spe/shared";
import { isNativePlatform } from "./platform";

export class QrScanCancelledError extends Error {
  constructor() {
    super("Escaneo cancelado");
    this.name = "QrScanCancelledError";
  }
}

/** Normaliza URL o payload spe:qr a `spe:qr:id:token`. */
export function normalizeScannedQr(raw: string): string | null {
  const parsed = parseQrPayload(raw);
  if (!parsed) return null;
  return formatQrPayload(parsed.qrId, parsed.token);
}

export function scannedQrToJoinPath(raw: string): string | null {
  const parsed = parseQrPayload(raw);
  if (!parsed) return null;
  return `/unirse-qr?qr=${encodeURIComponent(parsed.qrId)}&t=${encodeURIComponent(parsed.token)}`;
}

async function scanWithMlKit(): Promise<string | null> {
  if (!isNativePlatform()) return null;
  try {
    const { BarcodeScanner, BarcodeFormat } = await import(
      "@capacitor-mlkit/barcode-scanning"
    );
    const { supported } = await BarcodeScanner.isSupported();
    if (!supported) return null;

    const module = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!module.available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      return null;
    }

    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.QrCode],
    });
    const value = barcodes[0]?.rawValue?.trim();
    return value || null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/cancel|dismiss|user.?cancel/i.test(message)) {
      throw new QrScanCancelledError();
    }
    return null;
  }
}

/**
 * Escanea un QR con la cámara.
 * En Android intenta ML Kit (UI nativa); si no está listo, el caller usa el modal html5.
 * Devuelve el texto crudo del QR o null si hay que usar fallback web.
 */
export async function tryNativeQrScan(): Promise<string | null> {
  return scanWithMlKit();
}

export async function ensureCameraPermissionForQr(): Promise<boolean> {
  try {
    if (isNativePlatform()) {
      const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
      const current = await BarcodeScanner.checkPermissions();
      if (current.camera === "granted") return true;
      const requested = await BarcodeScanner.requestPermissions();
      return requested.camera === "granted";
    }
  } catch {
    // Fallback: Camera plugin / getUserMedia
  }

  try {
    const { Camera } = await import("@capacitor/camera");
    const current = await Camera.checkPermissions();
    if (current.camera === "granted") return true;
    const requested = await Camera.requestPermissions({ permissions: ["camera"] });
    return requested.camera === "granted";
  } catch {
    // último recurso: getUserMedia pedirá el permiso
  }

  return true;
}
