import { useState } from "react";
import {
  normalizeScannedQr,
  QrScanCancelledError,
  tryNativeQrScan,
} from "../lib/qrScanner";
import { QrScannerModal } from "./QrScannerModal";

interface ScanQrButtonProps {
  onScanned: (normalizedPayload: string, raw: string) => void;
  onInvalid?: (raw: string) => void;
  onError?: (message: string) => void;
  className?: string;
  label?: string;
  busyLabel?: string;
  disabled?: boolean;
}

/**
 * Botón «Escanear QR»: ML Kit en Android cuando está disponible,
 * si no abre el modal con cámara (html5-qrcode).
 */
export function ScanQrButton({
  onScanned,
  onInvalid,
  onError,
  className,
  label = "Escanear QR con cámara",
  busyLabel = "Abriendo cámara…",
  disabled,
}: ScanQrButtonProps) {
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRaw = (raw: string) => {
    const normalized = normalizeScannedQr(raw);
    if (!normalized) {
      onInvalid?.(raw);
      onError?.("El código no es un QR de SPE Eventos (sitio / entrada).");
      return;
    }
    onScanned(normalized, raw);
  };

  const startScan = async () => {
    setBusy(true);
    try {
      const nativeRaw = await tryNativeQrScan();
      if (nativeRaw) {
        handleRaw(nativeRaw);
        return;
      }
      setModalOpen(true);
    } catch (err) {
      if (err instanceof QrScanCancelledError) return;
      setModalOpen(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void startScan()}
        className={
          className ??
          "w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        }
      >
        {busy ? busyLabel : label}
      </button>
      <QrScannerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onScan={handleRaw}
      />
    </>
  );
}
