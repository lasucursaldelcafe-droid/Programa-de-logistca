import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  canAccessChatAudience,
  canSendInChatAudience,
  chatChannelId,
  comunicacionPath,
  listEventChatChannels,
  type ChatAudience,
} from "@spe/shared";
import { useAuth } from "../../contexts/AuthContext";
import { useChatMessages } from "../../hooks/useComunicacion";
import { useEventoOperacion } from "../../hooks/useEventoOperacion";
import { isFirebaseBackend } from "../../lib/backend";
import { isElectron, isNativePlatform } from "../../lib/platform";
import { ChatPanel } from "./ChatPanel";

function useShowChatBubble(): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Burbuja en móvil/tablet, APK y escritorio empaquetado; en desktop web ancha se usa la página completa.
  return narrow || isNativePlatform() || isElectron();
}

/**
 * Burbuja flotante de chat (estilo mensajería) en dispositivos aptos.
 * Se oculta en la página completa de Comunicación.
 */
export function ChatBubble() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const showBubble = useShowChatBubble();
  const { events, eventId, setEventId, evento } = useEventoOperacion();
  const [open, setOpen] = useState(false);

  const onComunicacionPage = pathname.includes("/comunicacion");
  const workerShell = pathname.startsWith("/worker");

  const channels = useMemo(() => {
    if (!eventId || !user) return [];
    const nombre = evento?.nombre ?? "Evento";
    return listEventChatChannels(eventId, nombre, user.role);
  }, [eventId, evento?.nombre, user]);

  const [audience, setAudience] = useState<ChatAudience>("evento");

  useEffect(() => {
    if (!user || channels.length === 0) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!canAccessChatAudience(user.role, audience)) {
        const first = channels[0]?.audience;
        if (first) setAudience(first);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, channels, audience]);

  const activeChannel = useMemo(() => {
    if (channels.length > 0) {
      return channels.find((c) => c.audience === audience) ?? channels[0]!;
    }
    return {
      audience: "evento" as const,
      channelId: chatChannelId(eventId || null),
      label: eventId ? `Chat · ${evento?.nombre ?? "Evento"}` : "Chat general",
      description: "Canal rápido",
    };
  }, [channels, audience, eventId, evento?.nombre]);

  const messages = useChatMessages(activeChannel.channelId);
  const canSend = Boolean(
    user && canSendInChatAudience(user.role, activeChannel.audience as ChatAudience),
  );

  if (!user || !isFirebaseBackend() || !showBubble || onComunicacionPage) {
    return null;
  }

  const fullPath = comunicacionPath(user.role);
  const fabBottom = workerShell
    ? "bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"
    : "bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]";

  return (
    <div className={`pointer-events-none fixed right-3 z-40 sm:right-5 ${fabBottom}`}>
      {open && (
        <div className="pointer-events-auto mb-3 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl shadow-black/50 spe-animate-in">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Chat</p>
              <p className="truncate text-[11px] text-neutral-500">
                {activeChannel?.label ?? "Equipo"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                to={fullPath}
                className="rounded-lg px-2 py-1 text-xs text-accent hover:bg-accent/10"
                onClick={() => setOpen(false)}
              >
                Abrir
              </Link>
              <button
                type="button"
                aria-label="Cerrar chat"
                className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {events.length > 0 && (
            <div className="border-b border-border px-3 py-2">
              <label className="block text-[11px] text-neutral-500">
                Evento
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-xs text-white"
                >
                  <option value="">General</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.nombre}
                    </option>
                  ))}
                </select>
              </label>
              {channels.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {channels.map((ch) => (
                    <button
                      key={ch.channelId}
                      type="button"
                      onClick={() => setAudience(ch.audience)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        audience === ch.audience
                          ? "bg-accent text-black"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {ch.audience === "evento"
                        ? "General"
                        : ch.audience === "empleados"
                          ? "Empleados"
                          : "Supervisión"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <ChatPanel
            channelId={activeChannel.channelId}
            channelLabel={activeChannel.label}
            eventId={eventId || undefined}
            audience={activeChannel.audience}
            messages={messages}
            canSend={canSend}
            className="h-[min(52vh,420px)] rounded-none border-0"
          />
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg shadow-accent/30 transition hover:scale-105 hover:brightness-110 active:scale-95"
      >
        {open ? (
          <span className="text-xl font-bold leading-none">✕</span>
        ) : (
          <ChatIcon />
        )}
      </button>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
        fill="currentColor"
      />
    </svg>
  );
}
