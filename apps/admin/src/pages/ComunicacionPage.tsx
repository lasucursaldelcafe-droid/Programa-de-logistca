import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  buildDmChannelId,
  canAccessChatAudience,
  canSendInChatAudience,
  canStartDirectChat,
  chatAudienceDescription,
  isDmChannelId,
  listEventChatChannels,
  type ChatAudience,
} from "@spe/shared";
import { useAuth } from "../contexts/AuthContext";
import { useChatMessages } from "../hooks/useComunicacion";
import { useEventoOperacion } from "../hooks/useEventoOperacion";
import { usePlatformUsers } from "../hooks/useDataStore";
import { ChatPanel } from "../components/comunicacion/ChatPanel";
import { VideoCallPanel } from "../components/comunicacion/VideoCallPanel";
import { EventoOperacionSelect } from "../components/EventoOperacionSelect";
import { PageHeader } from "../components/nav/PageHeader";
import { Card } from "../components/ui";
import { isFirebaseBackend } from "../lib/backend";

type Tab = "chat" | "video";
type Mode = "evento" | "directo";

export function ComunicacionPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, eventId, setEventId, evento } = useEventoOperacion();
  const platformUsers = usePlatformUsers();
  const [tab, setTab] = useState<Tab>("chat");
  const [audience, setAudience] = useState<ChatAudience>("evento");
  const [mode, setMode] = useState<Mode>("evento");
  const [peerUid, setPeerUid] = useState("");

  const dmFromQuery = searchParams.get("dm")?.trim() ?? "";

  useEffect(() => {
    if (!dmFromQuery || !user) return;
    if (dmFromQuery === user.uid) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setMode("directo");
      setPeerUid(dmFromQuery);
      setTab("chat");
    })();
    return () => {
      cancelled = true;
    };
  }, [dmFromQuery, user]);

  const channels = useMemo(() => {
    if (!eventId || !user) return [];
    const nombre = evento?.nombre ?? "Evento";
    return listEventChatChannels(eventId, nombre, user.role);
  }, [eventId, evento?.nombre, user]);

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

  const empleadosConCuenta = useMemo(() => {
    return platformUsers
      .filter(
        (u) =>
          u.habilitado !== false &&
          Boolean(u.workerId) &&
          (u.role === "trabajador" || u.role === "supervisor_sitio") &&
          u.uid !== user?.uid,
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [platformUsers, user?.uid]);

  const peerUser = useMemo(
    () => empleadosConCuenta.find((u) => u.uid === peerUid) ?? platformUsers.find((u) => u.uid === peerUid),
    [empleadosConCuenta, platformUsers, peerUid],
  );

  const canDirect = user ? canStartDirectChat(user.role) || Boolean(user.workerId) : false;

  const dmChannelId =
    user && peerUid && peerUid !== user.uid
      ? buildDmChannelId(user.uid, peerUid)
      : "";

  const activeChannel = useMemo(() => {
    if (mode === "directo" && dmChannelId && peerUser) {
      return {
        audience: "directo" as const,
        channelId: dmChannelId,
        label: `Chat · ${peerUser.nombre}`,
        description: "Conversación privada 1:1",
      };
    }
    return channels.find((c) => c.audience === audience) ?? channels[0] ?? null;
  }, [mode, dmChannelId, peerUser, channels, audience]);

  const channelId = activeChannel?.channelId ?? "";
  const channelLabel = activeChannel?.label ?? "Selecciona un canal";
  const messages = useChatMessages(channelId);
  const canSend = Boolean(
    user &&
      activeChannel &&
      (isDmChannelId(activeChannel.channelId)
        ? true
        : canSendInChatAudience(user.role, activeChannel.audience as ChatAudience)),
  );

  function openDirectWith(uid: string) {
    setMode("directo");
    setPeerUid(uid);
    setTab("chat");
    const next = new URLSearchParams(searchParams);
    next.set("dm", uid);
    setSearchParams(next, { replace: true });
  }

  function clearDirect() {
    setMode("evento");
    setPeerUid("");
    const next = new URLSearchParams(searchParams);
    next.delete("dm");
    setSearchParams(next, { replace: true });
  }

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
        description="Chat por evento o directo con un empleado. Al enviar un mensaje se muestra una alerta al destinatario."
      />

      <div className="flex flex-wrap items-end gap-3">
        {canDirect && (
          <div className="flex rounded-xl border border-border p-1">
            <button
              type="button"
              onClick={clearDirect}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                mode === "evento" ? "bg-accent text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Canales de evento
            </button>
            <button
              type="button"
              onClick={() => setMode("directo")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                mode === "directo" ? "bg-accent text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Chat con empleado
            </button>
          </div>
        )}

        {mode === "evento" && (
          <EventoOperacionSelect
            events={events}
            eventId={eventId}
            onChange={setEventId}
            label="Evento"
            className="w-full sm:w-auto"
          />
        )}

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

      {mode === "directo" ? (
        <Card>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-300">Empleado</span>
            <select
              value={peerUid}
              onChange={(e) => {
                const uid = e.target.value;
                if (uid) openDirectWith(uid);
                else clearDirect();
              }}
              className="w-full max-w-md rounded-lg border border-border bg-bg px-3 py-2"
            >
              <option value="">Seleccionar empleado…</option>
              {empleadosConCuenta.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.nombre}
                  {u.role === "supervisor_sitio" ? " (supervisor)" : ""} — {u.email}
                </option>
              ))}
            </select>
          </label>
          {empleadosConCuenta.length === 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              No hay empleados con cuenta activa. Invita personal y activa su acceso.
            </p>
          )}
          {peerUid && !peerUser && (
            <p className="mt-2 text-xs text-alert">
              No se encontró la cuenta del empleado (uid en el enlace). Elige uno de la lista.
            </p>
          )}
        </Card>
      ) : null}

      {mode === "evento" && !eventId ? (
        <Card>
          <p className="text-sm text-neutral-400">
            Selecciona un evento para abrir los canales de chat (general, empleados o supervisores),
            o usa «Chat con empleado» para un mensaje 1:1.
          </p>
        </Card>
      ) : mode === "directo" && !dmChannelId ? (
        <Card>
          <p className="text-sm text-neutral-400">
            Elige un empleado para abrir el chat privado. Al enviar, recibirá una notificación.
          </p>
        </Card>
      ) : (
        <>
          {mode === "evento" && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Canal de chat">
              {channels.map((ch) => (
                <button
                  key={ch.channelId}
                  type="button"
                  role="tab"
                  aria-selected={activeChannel?.channelId === ch.channelId}
                  onClick={() => setAudience(ch.audience)}
                  className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                    activeChannel?.channelId === ch.channelId
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
          )}

          <p className="text-xs text-neutral-500">
            Canal activo: <span className="text-neutral-300">{channelLabel}</span>
            {pathname.startsWith("/master") ? " · vista dirección" : null}
          </p>

          {activeChannel && tab === "chat" ? (
            <ChatPanel
              channelId={activeChannel.channelId}
              channelLabel={activeChannel.label}
              eventId={mode === "evento" ? eventId : undefined}
              audience={isDmChannelId(activeChannel.channelId) ? "directo" : audience}
              peerUid={mode === "directo" ? peerUid : undefined}
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
