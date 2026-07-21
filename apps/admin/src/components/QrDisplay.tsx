import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatQrPayload, getRotatingToken } from "@spe/shared";
import type { QrCode } from "@spe/shared";
import { buildSiteQrJoinUrl } from "../lib/urls";

export function QrDisplay({ qr, effectiveToken }: { qr: QrCode; effectiveToken: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** URL pública: al escanear con la cámara abre el alta / puesto. */
  const joinUrl = buildSiteQrJoinUrl(qr.id, effectiveToken);
  const legacyPayload = formatQrPayload(qr.id, effectiveToken);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Negro sobre blanco: contraste alto para que la cámara del teléfono lea el código.
      // (Naranja sobre fondo oscuro fallaba al escanear en muchos dispositivos.)
      try {
        const url = await QRCode.toDataURL(joinUrl, {
          width: 220,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        if (!cancelled) {
          setError(null);
          setDataUrl(url);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setDataUrl(null);
          setError(err instanceof Error ? err.message : "No se pudo dibujar el QR.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  return (
    <div className="flex flex-col items-center gap-3">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR ${qr.siteNombre}`}
          className="rounded-lg border border-border bg-white p-2"
        />
      ) : error ? (
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg border border-alert/40 bg-bg p-3 text-center text-xs text-alert">
          {error}
        </div>
      ) : (
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg border border-border bg-bg text-xs text-neutral-500">
          Generando QR…
        </div>
      )}
      <p className="max-w-xs text-center text-xs text-neutral-400">
        Escanea para configurar usuario, habilitar puesto y avisar a administración.
      </p>
      <code className="max-w-full break-all rounded bg-bg px-2 py-1 font-mono text-[10px] text-neutral-400">
        {joinUrl}
      </code>
      <code className="max-w-full break-all font-mono text-[9px] text-neutral-600">
        Entrada (app): {legacyPayload}
      </code>
    </div>
  );
}

export function resolveEffectiveToken(qr: QrCode, nowMs = Date.now()): string {
  if (qr.modo === "rotativo" && qr.secret && qr.intervaloRotacionSegundos) {
    return getRotatingToken(qr.id, qr.secret, qr.intervaloRotacionSegundos, nowMs);
  }
  return qr.token;
}
