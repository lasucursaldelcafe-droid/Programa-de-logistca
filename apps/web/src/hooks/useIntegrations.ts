import { useCallback, useState } from "react";
import type { IntegracionConexion, TipoIntegracion } from "@spe/shared";
import { integrationHub } from "@spe/integrations";

export function useIntegrations() {
  const [conexiones, setConexiones] = useState<IntegracionConexion[]>(() => integrationHub.list());
  const [loading, setLoading] = useState<TipoIntegracion | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString("es-CO")}] ${msg}`, ...prev].slice(0, 20));
  }, []);

  const refresh = useCallback(() => {
    setConexiones(integrationHub.list());
  }, []);

  const connect = useCallback(
    async (id: TipoIntegracion, secret?: string) => {
      setLoading(id);
      const connector = integrationHub.get(id);
      if (!connector) return;
      const result = await connector.connect(secret);
      refresh();
      if (result.ok) pushLog(`${connector.nombre}: conectado`);
      else pushLog(`${connector.nombre}: error — ${result.error}`);
      setLoading(null);
      return result;
    },
    [pushLog, refresh],
  );

  const disconnect = useCallback(
    async (id: TipoIntegracion) => {
      const connector = integrationHub.get(id);
      if (!connector) return;
      await connector.disconnect();
      refresh();
      pushLog(`${connector.nombre}: desconectado`);
    },
    [pushLog, refresh],
  );

  const test = useCallback(
    async (id: TipoIntegracion) => {
      setLoading(id);
      const connector = integrationHub.get(id);
      if (!connector) return;
      const result = await connector.test();
      pushLog(result.ok ? `${connector.nombre}: ${result.data}` : `${connector.nombre}: ${result.error}`);
      setLoading(null);
      return result;
    },
    [pushLog],
  );

  return { conexiones, loading, log, connect, disconnect, test, pushLog };
}
