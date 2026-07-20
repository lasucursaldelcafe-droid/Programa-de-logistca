interface VideoCallModalProps {
  roomName: string;
  titulo: string;
  onClose: () => void;
}

export function VideoCallModal({ roomName, titulo, onClose }: VideoCallModalProps) {
  const embedUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}#config.prejoinPageEnabled=false`;

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Videollamada"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-accent">Videollamada en vivo</p>
          <h2 className="truncate font-display text-lg font-semibold">{titulo}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm hover:bg-neutral-800"
        >
          Cerrar
        </button>
      </div>
      <iframe
        title={`Videollamada ${titulo}`}
        src={embedUrl}
        allow="camera; microphone; fullscreen; display-capture"
        className="h-full min-h-[60vh] w-full flex-1 border-0"
      />
    </div>
  );
}
