import { useMemo } from "react";
import { buildVideoRoomName } from "../../hooks/useComunicacion";

interface VideoCallPanelProps {
  channelId: string;
  channelLabel: string;
  userName: string;
}

export function VideoCallPanel({ channelId, channelLabel, userName }: VideoCallPanelProps) {
  const roomName = useMemo(() => buildVideoRoomName(channelId), [channelId]);
  const jitsiUrl = useMemo(() => {
    const params = new URLSearchParams({
      lang: "es",
      userInfo: JSON.stringify({ displayName: userName }),
    });
    return `https://meet.jit.si/${roomName}#${params.toString()}`;
  }, [roomName, userName]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-neutral-300">
        <p>
          Sala: <span className="font-mono text-accent">{roomName}</span>
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Canal «{channelLabel}». Comparte el enlace con el equipo; todos entran a la misma sala.
        </p>
        <a
          href={jitsiUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-accent hover:underline"
        >
          Abrir videollamada en pestaña nueva →
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        <iframe
          title={`Videollamada ${channelLabel}`}
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-[min(70vh,560px)] w-full"
        />
      </div>

      <p className="text-xs text-neutral-500">
        Permite cámara y micrófono cuando el navegador lo pida. En móvil, usa Chrome o Safari.
      </p>
    </div>
  );
}
