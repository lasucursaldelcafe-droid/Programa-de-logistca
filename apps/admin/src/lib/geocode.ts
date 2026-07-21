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

/** Preferir Geocoder del Maps JS (sin CORS) cuando el mapa ya cargó la API. */
async function geocodeWithMapsJs(address: string): Promise<GeocodeResult | null> {
  if (!mapsJsReady()) return null;
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
}

async function reverseWithMapsJs(lat: number, lng: number): Promise<string | null> {
  if (!mapsJsReady()) return null;
  const geocoder = new google.maps.Geocoder();
  const response = await geocoder.geocode({
    location: { lat, lng },
    language: "es",
  });
  return response.results[0]?.formatted_address ?? null;
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
  } catch {
    /* fallback REST */
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "co");
  url.searchParams.set("language", "es");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as GeocodeApiResponse;
  if (data.error_message) {
    throw new Error(data.error_message);
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
  } catch {
    /* fallback REST */
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "es");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as GeocodeApiResponse;
  return data.results?.[0]?.formatted_address ?? null;
}
