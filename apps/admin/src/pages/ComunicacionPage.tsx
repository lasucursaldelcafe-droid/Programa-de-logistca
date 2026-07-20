import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { chatChannelId, useChatMessages } from "../hooks/useComunicacion";
import { useEventoOperacion } from "../hooks/useEventoOperacion";
import { ChatPanel } from "../components/comunicacion/ChatPanel";
import { VideoCallPanel } from "../components/comunicacion/VideoCallPanel";
import { EventoOperacionSelect } from "../components/EventoOperacionSelect";
import { PageHeader } from "../components/nav/PageHeader";
import { Card } from "../components/ui";
import { isFirebaseBackend } from "../lib/backend";

type Tab = "chat" | "video";

export function ComunicacionPage() {
  const { user } = useAuth();
  const { events, eventId, setEventId, evento } = useEventoOperacion();
  const [tab, setTab] = useState<Tab>("chat");

  const channelId = chatChannelId(eventId || null);
  const channelLabel = useMemo(() => {
    if (!eventId) return "General";
    return evento?.nombre ?? "Evento";
  }, [eventId, evento]);

  const messages = useChatMessages(channelId);

  if (!user) return null;

  if (!isFirebaseBackend()) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="Comunicación"
          description="Chat interno y videollamadas del equipo."
        />
        <Card>
          <p className="text-sm text-neutral-400">
            Chat y videollamadas requieren Firebase configurado. Revisa la configuración en
            pendientes o contacta al administrador.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Comunicación"
        description="Chat y videollamadas del equipo. El canal sigue el evento seleccionado en Operación."
      />

      <div className="flex flex-wrap items-end gap-3">
        <EventoOperacionSelect
          events={events}
          eventId={eventId}
          onChange={setEventId}
          label="Canal del evento"
          className="min-w-[220px]"
        />

        <div className="flex rounded-xl border border-border p-1">
          <button
            type="button"
            onClick={() => setTab("chat")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "chat" ? "bg-accent text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setTab("video")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "video" ? "bg-accent text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Videollamada
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Canal activo: <span className="text-neutral-300">{channelLabel}</span> — cambia el evento
        aquí o en Operación por evento; se sincroniza en mapa y chat.
      </p>

      {tab === "chat" ? (
        <ChatPanel
          channelId={channelId}
          channelLabel={channelLabel}
          eventId={eventId || undefined}
          messages={messages}
        />
      ) : (
        <VideoCallPanel
          channelId={channelId}
          channelLabel={channelLabel}
          userName={user.nombre}
        />
      )}
    </div>
  );
}
