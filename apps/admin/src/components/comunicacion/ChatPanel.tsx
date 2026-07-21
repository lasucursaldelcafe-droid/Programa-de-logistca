import { FormEvent, useEffect, useRef, useState } from "react";
import { ROLE_LABEL, type ChatAudienceOrDm, type ChatMessage } from "@spe/shared";
import { useAuth } from "../../contexts/AuthContext";
import { sendChatMessage } from "../../hooks/useComunicacion";

interface ChatPanelProps {
  channelId: string;
  channelLabel: string;
  eventId?: string;
  audience?: ChatAudienceOrDm;
  peerUid?: string;
  messages: ChatMessage[];
  canSend?: boolean;
}

export function ChatPanel({
  channelId,
  channelLabel,
  eventId,
  audience,
  peerUid,
  messages,
  canSend = true,
}: ChatPanelProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim() || !canSend) return;
    setSending(true);
    setError(null);
    try {
      await sendChatMessage({
        channelId,
        channelLabel,
        text,
        senderUid: user.uid,
        senderNombre: user.nombre,
        senderRole: user.role,
        eventId,
        audience,
        peerUid,
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  const placeholder =
    audience === "directo"
      ? "Mensaje privado…"
      : audience === "empleados"
        ? "Mensaje a empleados…"
        : audience === "supervisores"
          ? "Mensaje a supervisores…"
          : "Mensaje al evento…";

  return (
    <div className="flex h-[min(70vh,560px)] flex-col rounded-2xl border border-border bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Sin mensajes aún. Escribe el primero para «{channelLabel}».
            {audience === "directo"
              ? " El empleado recibirá una notificación al enviarlo."
              : ""}
          </p>
        ) : (
          messages.map((m) => {
            const mine = user?.uid === m.senderUid;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-accent/20 text-white ring-1 ring-accent/30"
                      : "bg-neutral-800/80 text-neutral-100"
                  }`}
                >
                  {!mine && (
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                      {m.senderNombre} ·{" "}
                      {ROLE_LABEL[m.senderRole as keyof typeof ROLE_LABEL] ?? m.senderRole}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <time className="mt-1 block text-[10px] text-neutral-500">
                    {new Date(m.createdAt).toLocaleString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </time>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="border-t border-border p-3">
        {error && <p className="mb-2 text-xs text-alert">{error}</p>}
        {!canSend && (
          <p className="mb-2 text-xs text-neutral-500">
            No puedes escribir en este canal con tu rol actual.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            maxLength={2000}
            className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            disabled={!user || sending || !canSend}
          />
          <button
            type="submit"
            disabled={!user || sending || !text.trim() || !canSend}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {sending ? "…" : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
