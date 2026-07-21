import { useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { ensureCameraPermissionForQr } from "../lib/qrScanner";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (raw: string) => void;
  title?: string;
  hint?: string;
}

/**
 * Escáner QR con cámara (WebView / navegador) usando html5-qrcode.
 * En Android nativo se usa primero ML Kit; este modal es el fallback universal.
 */
export function QrScannerModal({
  open,
  onClose,
  onScan,
  title = "Escanear código QR",
  hint = "Apunta la cámara al QR del sitio.",
}: QrScannerModalProps) {
  const reactId = useId();
  const regionId = `spe-qr-reader-${reactId.replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    handledRef.current = false;

    const stopScanner = async () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore
      }
      try {
        scanner.clear();
      } catch {
        // ignore
      }
    };

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setError(null);
      setStarting(true);

      const allowed = await ensureCameraPermissionForQr();
      if (cancelled) return;
      if (!allowed) {
        setStarting(false);
        setError("Permiso de cámara denegado. Actívalo en Ajustes → SPE Eventos → Cámara.");
        return;
      }

      try {
        const { Html5Qrcode: Html5QrcodeCtor } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5QrcodeCtor(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (handledRef.current || cancelled) return;
            handledRef.current = true;
            const value = decoded.trim();
            void stopScanner().then(() => {
              if (value) onScanRef.current(value);
              onCloseRef.current();
            });
          },
          () => undefined,
        );
        if (!cancelled) setStarting(false);
      } catch (err) {
        if (cancelled) return;
        setStarting(false);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo abrir la cámara. Revisa el permiso de cámara.",
        );
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, regionId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h2 id="qr-scanner-title" className="font-display text-lg font-semibold text-white">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-neutral-400 hover:bg-white/5 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="p-4">
          {starting && !error && (
            <p className="mb-3 text-center text-sm text-neutral-400">Abriendo cámara…</p>
          )}
          {error && (
            <p className="mb-3 rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>
          )}
          <div
            id={regionId}
            className="overflow-hidden rounded-xl bg-black [&_video]:max-h-[55vh] [&_video]:w-full [&_video]:object-cover"
          />
        </div>
      </div>
    </div>
  );
}
