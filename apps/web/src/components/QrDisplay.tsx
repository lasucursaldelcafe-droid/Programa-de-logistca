import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatQrPayload, getRotatingToken } from "@spe/shared";
import type { QrCode } from "@spe/shared";

export function QrDisplay({ qr, effectiveToken }: { qr: QrCode; effectiveToken: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const payload = formatQrPayload(qr.id, effectiveToken);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, { width: 220, margin: 2, color: { dark: "#E8823C", light: "#0A0A0A" } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="flex flex-col items-center gap-3">
      {dataUrl ? (
        <img src={dataUrl} alt={`QR ${qr.siteNombre}`} className="rounded-lg border border-border" />
      ) : (
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg border border-border bg-bg text-xs text-neutral-500">
          Generando QR…
        </div>
      )}
      <code className="max-w-full break-all rounded bg-bg px-2 py-1 font-mono text-[10px] text-neutral-400">
        {payload}
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
