import { Navigate, useSearchParams } from "react-router-dom";

/** Mapa global deprecado: redirige al dashboard del evento con supervisión. */
export function MapaEnVivoPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "supervision";
  return <Navigate to={`/operacion?tab=${tab}`} replace />;
}
