import { useEffect, useMemo, useState } from "react";
import { puedeUsarComunicacion } from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui";
import { PageHeader } from "../components/nav/PageHeader";
import { VideoCallModal } from "../components/VideoCallModal";
import {
  ensureEventConversation,
  sendChatMessage,
  startVideoCall,
  useConversations,
  useMessages,
} from "../hooks/useChat";
import { useEvents } from "../hooks/useDataStore";

export function ComunicacionPage() {
  const { user } = useAuth();
  const events = useEvents();
  const [eventoId, setEventoId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [videoRoom, setVideoRoom] = useState<{ roomName: string; titulo: string } | null>(null);

  const eventoActivo = useMemo(
    () => events.find((e) => e.id === eventoId) ?? events[0] ?? null,
    [events, eventoId],
  );

  useEffect(() => {
    if (eventoActivo && !eventoId) setEventoId(eventoActivo.id);
  }, [eventoActivo, eventoId]);

  useEffect(() => {
    if (!user || !eventoActivo) return;
    void ensureEventConversation({
      eventId: eventoActivo.id,
      eventNombre: eventoActivo.nombre,
      actor: user,
    });
  }, [user, eventoActivo?.id, eventoActivo?.nombre]);

  const conversations = useConversations(user, eventoActivo?.id);
  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null;
  const messages = useMessages(selected?.id ?? null);

  useEffect(() => {
    if (selected && selectedId !== selected.id) setSelectedId(selected.id);
  }, [selected, selectedId]);

  if (!user || !puedeUsarComunicacion(user.role)) {
    return <p className="text-neutral-400">Sin acceso a comunicación.</p>;
  }

  const currentUser = user;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !texto.trim()) return;
    setBusy(true);
    try {
      await sendChatMessage({ conversationId: selected.id, sender: currentUser, texto });
      setTexto("");
    } finally {
      setBusy(false);
    }
  }

  async function handleVideoCall() {
    if (!selected) return;
    setBusy(true);
    try {
      const room = await startVideoCall({ conversation: selected, actor: currentUser });
      setVideoRoom({ roomName: room.roomName, titulo: selected.titulo });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Comunicación"
        description="Chat virtual y videollamadas por evento"
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Evento
          <select
            value={eventoActivo?.id ?? ""}
            onChange={(e) => {
              setEventoId(e.target.value);
              setSelectedId(null);
            }}
            className="mt-1 block rounded-lg border border-border bg-bg px-3 py-2"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="p-0">
          <div className="border-b border-border px-3 py-2 text-xs font-medium text-neutral-400">
            Canales
          </div>
          <ul className="max-h-[420px] overflow-y-auto">
            {conversations.length === 0 && (
              <li className="px-3 py-4 text-sm text-neutral-500">Sin canales aún.</li>
            )}
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full px-3 py-3 text-left text-sm transition hover:bg-neutral-800/50 ${
                    selected?.id === c.id ? "bg-accent/10 text-accent" : ""
                  }`}
                >
                  <p className="font-medium">{c.titulo}</p>
                  {c.lastMessagePreview && (
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      {c.lastMessagePreview}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex min-h-[420px] flex-col p-0">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <p className="font-medium">{selected.titulo}</p>
                  <p className="text-xs text-neutral-500">{selected.eventNombre}</p>
                </div>
                <button
                  type="button"
                  onClick={handleVideoCall}
                  disabled={busy}
                  className="rounded-lg bg-positive px-3 py-2 text-xs font-semibold text-bg disabled:opacity-50"
                >
                  Iniciar videollamada
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {messages.map((m) => {
                  const propio = m.senderUid === currentUser.uid;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${propio ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          propio ? "bg-accent/20 text-accent" : "bg-neutral-800 text-neutral-200"
                        }`}
                      >
                        {!propio && (
                          <p className="mb-0.5 text-xs font-medium text-neutral-400">
                            {m.senderNombre}
                          </p>
                        )}
                        <p>{m.texto}</p>
                        <p className="mt-1 text-[10px] opacity-60">
                          {new Date(m.creadoEn).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escribe un mensaje…"
                  className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !texto.trim()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <p className="p-6 text-sm text-neutral-500">Selecciona un canal para chatear.</p>
          )}
        </Card>
      </div>

      {videoRoom && (
        <VideoCallModal
          roomName={videoRoom.roomName}
          titulo={videoRoom.titulo}
          onClose={() => setVideoRoom(null)}
        />
      )}
    </div>
  );
}
