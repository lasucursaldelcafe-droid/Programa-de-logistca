import { useState } from "react";
import { Card } from "./ui";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";
import { NavIcon } from "./nav/NavIcons";

const INTEGRACIONES = [
  {
    id: "siigo",
    nombre: "Siigo Nube",
    destino: "Clientes · Inventario · Facturación",
    obtener: "Siigo → Alianzas → credencial API",
    doc: "https://developers.siigo.com/docs/siigoapi/",
  },
  {
    id: "whatsapp",
    nombre: "WhatsApp",
    destino: "Mensajería y plantillas",
    obtener: "Meta → WhatsApp → API Setup",
    doc: "https://developers.facebook.com/docs/whatsapp/cloud-api/",
  },
  {
    id: "facebook",
    nombre: "Facebook",
    destino: "Página y mensajes",
    obtener: "Meta → App ID + Page Token",
    doc: "https://developers.facebook.com/docs/graph-api/",
  },
  {
    id: "instagram",
    nombre: "Instagram",
    destino: "Cuenta profesional",
    obtener: "Meta → Instagram Business ID",
    doc: "https://developers.facebook.com/docs/instagram-api/",
  },
  {
    id: "webhook",
    nombre: "Webhook",
    destino: "Eventos externos → SPE",
    obtener: "URL HTTPS + secret HMAC",
    doc: undefined,
  },
] as const;

export function IntegracionesAyuda() {
  const deployLinks = useDeploymentLinks();
  const guiaUrl = deployLinks?.pagesUrl
    ? `${deployLinks.pagesUrl}INTEGRACIONES-APIS.md`
    : "/INTEGRACIONES-APIS.md";
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-border bg-bg/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <NavIcon name="help" className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-neutral-200">
              Guía de credenciales
            </p>
            <p className="text-xs text-neutral-500">
              Dónde obtener cada API y qué módulo alimenta
            </p>
          </div>
        </div>
        <span className="text-xs text-neutral-500">{open ? "Ocultar" : "Ver"}</span>
      </button>

      {open && (
        <div className="mt-4 border-t border-border pt-4">
          <a
            href={guiaUrl}
            className="text-xs text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Documento completo →
          </a>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-2 pr-3 font-medium">API</th>
                  <th className="pb-2 pr-3 font-medium">Conecta con</th>
                  <th className="pb-2 font-medium">Obtener en</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INTEGRACIONES.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-3 font-medium text-neutral-200">
                      {item.nombre}
                      {item.doc && (
                        <a
                          href={item.doc}
                          className="ml-2 text-[10px] text-accent hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          docs
                        </a>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-neutral-400">{item.destino}</td>
                    <td className="py-2.5 text-xs text-neutral-500">{item.obtener}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Modo demo: sin HTTP real. En producción, Siigo sincroniza clientes, productos y facturas
            hacia los módulos de negocio.
          </p>
        </div>
      )}
    </Card>
  );
}
