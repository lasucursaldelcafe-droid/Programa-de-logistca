import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useEvents } from "../hooks/useDataStore";
import { chatChannelId, useChatMessages } from "../hooks/useComunicacion";
import { ChatPanel } from "../components/comunicacion/ChatPanel";
import { VideoCallPanel } from "../components/comunicacion/VideoCallPanel";
import { PageHeader } from "../components/nav/PageHeader";
import { Card } from "../components/ui";
import { isFirebaseBackend } from "../lib/backend";

type Tab = "chat" | "video";

export function ComunicacionPage() {
  const { user } = useAuth();
  const events = useEvents();
  const [tab, setTab] = useState<Tab>("chat");
  const [eventId, setEventId] = useState<string>("");

  const channelId = chatChannelId(eventId || null);
  const channelLabel = useMemo(() => {
    if (!eventId) return "General";
    return events.find((e) => e.id === eventId)?.nombre ?? "Evento";
  }, [eventId, events]);

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
        description="Chat interno en tiempo real y videollamadas con el equipo en campo."
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Canal</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2 text-sm text-white"
          >
            <option value="">General (toda la operación)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </select>
        </label>

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
