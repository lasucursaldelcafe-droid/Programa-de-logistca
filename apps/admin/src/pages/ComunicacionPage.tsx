import { useEffect, useMemo, useState } from "react";
import {
  canAccessChatAudience,
  canSendInChatAudience,
  chatAudienceDescription,
  listEventChatChannels,
  type ChatAudience,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { useChatMessages } from "../hooks/useComunicacion";
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
  const [audience, setAudience] = useState<ChatAudience>("evento");

  const channels = useMemo(() => {
    if (!eventId || !user) return [];
    const nombre = evento?.nombre ?? "Evento";
    return listEventChatChannels(eventId, nombre, user.role);
  }, [eventId, evento?.nombre, user]);

  useEffect(() => {
    if (!user || channels.length === 0) return;
    if (!canAccessChatAudience(user.role, audience)) {
      const first = channels[0]?.audience;
      if (first) setAudience(first);
    }
  }, [user, channels, audience]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.audience === audience) ?? channels[0] ?? null,
    [channels, audience],
  );

  const channelId = activeChannel?.channelId ?? "";
  const channelLabel = activeChannel?.label ?? "Selecciona un evento";
  const messages = useChatMessages(channelId);
  const canSend = user && activeChannel
    ? canSendInChatAudience(user.role, activeChannel.audience)
    : false;

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
        description="Chat y videollamadas: evento general, empleados o supervisores. Dirección (CEO) puede ver y unirse a todos los canales."
      />

      <div className="flex flex-wrap items-end gap-3">
        <EventoOperacionSelect
          events={events}
          eventId={eventId}
          onChange={setEventId}
          label="Evento"
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

      {!eventId ? (
        <Card>
          <p className="text-sm text-neutral-400">
            Selecciona un evento para abrir los canales de chat (general, empleados o supervisores).
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Canal de chat">
            {channels.map((ch) => (
              <button
                key={ch.channelId}
                type="button"
                role="tab"
                aria-selected={activeChannel?.audience === ch.audience}
                onClick={() => setAudience(ch.audience)}
                className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeChannel?.audience === ch.audience
                    ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                    : "border border-border text-neutral-400 hover:border-accent/40 hover:text-neutral-200"
                }`}
              >
                <span className="block font-semibold">
                  {ch.audience === "evento"
                    ? "Evento general"
                    : ch.audience === "empleados"
                      ? "Empleados"
                      : "Supervisores"}
                </span>
                <span className="mt-0.5 block text-[11px] opacity-80">
                  {chatAudienceDescription(ch.audience)}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-neutral-500">
            Canal activo: <span className="text-neutral-300">{channelLabel}</span>
            {activeChannel?.audience === "supervisores" && user.role === "trabajador"
              ? " — no tienes acceso a este canal."
              : null}
          </p>

          {activeChannel && tab === "chat" ? (
            <ChatPanel
              channelId={activeChannel.channelId}
              channelLabel={activeChannel.label}
              eventId={eventId}
              audience={activeChannel.audience}
              messages={messages}
              canSend={canSend}
            />
          ) : activeChannel && tab === "video" ? (
            <VideoCallPanel
              channelId={activeChannel.channelId}
              channelLabel={activeChannel.label}
              userName={user.nombre}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
