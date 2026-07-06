import { Card } from "./ui";
import { useDeploymentLinks } from "../hooks/useDeploymentLinks";

const INTEGRACIONES_RESUMEN = [
  {
    id: "siigo",
    icon: "📊",
    nombre: "Siigo Nube",
    obtener: "Siigo Nube → Alianzas → Mi credencial API (usuario + access_key + Partner-Id)",
    alConectar: "Sincroniza clientes, inventario y facturas hacia Clientes, Inventario y Facturación.",
    doc: "https://developers.siigo.com/docs/siigoapi/",
  },
  {
    id: "whatsapp",
    icon: "💬",
    nombre: "WhatsApp Cloud API",
    obtener: "Meta for Developers → App → WhatsApp → API Setup (token + Phone Number ID)",
    alConectar: "Envío de plantillas y recepción de mensajes vía webhook en servidor.",
    doc: "https://developers.facebook.com/docs/whatsapp/cloud-api/",
  },
  {
    id: "facebook",
    icon: "📘",
    nombre: "Facebook",
    obtener: "Meta for Developers → App ID, App Secret, Page Access Token, Page ID",
    alConectar: "Lectura de actividad y mensajes de la página.",
    doc: "https://developers.facebook.com/docs/graph-api/",
  },
  {
    id: "instagram",
    icon: "📸",
    nombre: "Instagram",
    obtener: "Misma app Meta + Instagram Business Account ID y token",
    alConectar: "Actividad y mensajes directos de cuenta profesional.",
    doc: "https://developers.facebook.com/docs/instagram-api/",
  },
  {
    id: "webhook",
    icon: "🌐",
    nombre: "Webhook entrante",
    obtener: "URL HTTPS de tu servidor + secret HMAC + verify token",
    alConectar: "Recibe eventos externos y los registra en SPE.",
    doc: undefined,
  },
] as const;

export function IntegracionesAyuda() {
  const deployLinks = useDeploymentLinks();
  const guiaUrl = deployLinks?.pagesUrl
    ? `${deployLinks.pagesUrl}INTEGRACIONES-APIS.md`
    : "/INTEGRACIONES-APIS.md";

  return (
    <Card className="border-border bg-bg/80">
      <h2 className="font-display text-lg font-semibold">Registro de APIs — cómo obtenerlas y qué conectan</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Guía completa con autenticación Siigo, restricciones y mapeo a módulos SPE.{" "}
        <a href={guiaUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
          Abrir documento completo →
        </a>
      </p>

      <div className="mt-4 space-y-3">
        {INTEGRACIONES_RESUMEN.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-bg px-3 py-3 text-sm"
          >
            <p className="font-semibold text-neutral-200">
              {item.icon} {item.nombre}
            </p>
            <p className="mt-1 text-neutral-400">
              <span className="text-neutral-500">Obtener: </span>
              {item.obtener}
            </p>
            <p className="mt-1 text-neutral-400">
              <span className="text-neutral-500">Al conectar: </span>
              {item.alConectar}
            </p>
            {item.doc && (
              <p className="mt-1">
                <a
                  href={item.doc}
                  className="text-xs text-accent hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentación oficial →
                </a>
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-3 py-3 text-xs text-neutral-400">
        <p className="font-semibold text-accent">Siigo — conexión de datos</p>
        <p className="mt-1">
          Con credenciales válidas, SPE consulta <code className="text-neutral-300">/v1/customers</code>,{" "}
          <code className="text-neutral-300">/v1/products</code> y{" "}
          <code className="text-neutral-300">/v1/invoices</code> (paginado, Partner-Id y JWT 24 h).
          Los datos alimentan <strong className="text-neutral-300">Clientes</strong>,{" "}
          <strong className="text-neutral-300">Inventario</strong> y{" "}
          <strong className="text-neutral-300">Facturación</strong>, respetando permisos y límites de la API Siigo.
        </p>
        <p className="mt-2 text-neutral-500">
          Modo actual: demo (sin HTTP real). Al activar producción, el sync escribe en la base de datos del tenant.
        </p>
      </div>
    </Card>
  );
}
