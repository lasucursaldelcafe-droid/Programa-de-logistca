export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface GeocodeApiResponse {
  status: string;
  results?: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
  error_message?: string;
}

/** Error de geocodificación con mensaje listo para la UI. */
export class GeocodeUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodeUserError";
  }
}

function parseGeocodeResponse(data: GeocodeApiResponse): GeocodeResult | null {
  const first = data.results?.[0];
  if (data.status !== "OK" || !first) return null;
  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
  };
}

function mapsJsReady(): boolean {
  return typeof google !== "undefined" && Boolean(google.maps?.Geocoder);
}

/**
 * Traduce errores típicos de Google Geocoding / Maps a instrucciones en español.
 * El caso más común: Maps JS funciona pero Geocoding API no está habilitada.
 */
export function toGeocodeUserMessage(raw: unknown): string {
  const text =
    raw instanceof Error
      ? raw.message
      : typeof raw === "string"
        ? raw
        : "";

  if (/not activated|has not been used|API project/i.test(text) || /REQUEST_DENIED/i.test(text)) {
    return (
      "Falta activar «Geocoding API» en Google Cloud (la del mapa no alcanza). " +
      "Console → APIs y servicios → Biblioteca → Geocoding API → Habilitar. " +
      "Mientras tanto: toca el mapa o arrastra el pin para marcar el sitio."
    );
  }
  if (/Billing|billing account/i.test(text)) {
    return (
      "Google Maps pide una cuenta de facturación activa (hay crédito gratuito). " +
      "Mientras tanto: marca el punto tocando el mapa."
    );
  }
  if (/ApiNotActivatedMapError|InvalidKey|ApiTargetBlockedMapError/i.test(text)) {
    return (
      "La clave de Maps no permite esta búsqueda. Revisa restricciones de API/dominio en Google Cloud. " +
      "Puedes marcar el punto tocando el mapa."
    );
  }
  if (text.trim()) {
    return `${text} — Mientras tanto, toca el mapa o arrastra el pin.`;
  }
  return "No se pudo buscar la dirección. Toca el mapa o arrastra el pin para marcar el sitio.";
}

function throwIfApiDisabled(raw: unknown): void {
  const text = raw instanceof Error ? raw.message : String(raw ?? "");
  if (/not activated|has not been used|REQUEST_DENIED|ApiNotActivated/i.test(text)) {
    throw new GeocodeUserError(toGeocodeUserMessage(text));
  }
}

/** Preferir Geocoder del Maps JS (sin CORS) cuando el mapa ya cargó la API. */
async function geocodeWithMapsJs(address: string): Promise<GeocodeResult | null> {
  if (!mapsJsReady()) return null;
  try {
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({
      address,
      region: "CO",
      language: "es",
    });
    const first = response.results[0];
    if (!first?.geometry?.location) return null;
    return {
      lat: first.geometry.location.lat(),
      lng: first.geometry.location.lng(),
      formattedAddress: first.formatted_address,
    };
  } catch (err) {
    throwIfApiDisabled(err);
    throw err;
  }
}

async function reverseWithMapsJs(lat: number, lng: number): Promise<string | null> {
  if (!mapsJsReady()) return null;
  try {
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({
      location: { lat, lng },
      language: "es",
    });
    return response.results[0]?.formatted_address ?? null;
  } catch (err) {
    throwIfApiDisabled(err);
    return null;
  }
}

/** Geocodifica una dirección con Google Geocoding (Maps JS o REST). */
export async function geocodeAddress(
  address: string,
  apiKey: string,
): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query || !apiKey) return null;

  try {
    const viaJs = await geocodeWithMapsJs(query);
    if (viaJs) return viaJs;
  } catch (err) {
    if (err instanceof GeocodeUserError) throw err;
    throwIfApiDisabled(err);
    /* otros errores → intentar REST */
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "co");
  url.searchParams.set("language", "es");

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new GeocodeUserError(toGeocodeUserMessage("network"));
  }
  if (!res.ok) {
    throw new GeocodeUserError(toGeocodeUserMessage(`HTTP ${res.status}`));
  }

  const data = (await res.json()) as GeocodeApiResponse;
  if (data.status === "REQUEST_DENIED" || data.error_message) {
    throw new GeocodeUserError(
      toGeocodeUserMessage(data.error_message || data.status),
    );
  }
  if (data.status === "ZERO_RESULTS") return null;
  if (data.status !== "OK") {
    throw new GeocodeUserError(toGeocodeUserMessage(data.status));
  }
  return parseGeocodeResponse(data);
}

/** Obtiene dirección legible a partir de coordenadas. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string,
): Promise<string | null> {
  if (!apiKey) return null;

  try {
    const viaJs = await reverseWithMapsJs(lat, lng);
    if (viaJs) return viaJs;
  } catch (err) {
    if (err instanceof GeocodeUserError) return null;
    /* fallback REST */
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "es");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as GeocodeApiResponse;
    if (data.status === "REQUEST_DENIED") return null;
    return data.results?.[0]?.formatted_address ?? null;
  } catch {
    return null;
  }
}
