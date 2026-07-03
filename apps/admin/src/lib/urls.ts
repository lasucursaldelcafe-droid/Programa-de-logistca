export function buildActivationUrl(token: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${window.location.origin}${normalized}activar/${token}`;
}
