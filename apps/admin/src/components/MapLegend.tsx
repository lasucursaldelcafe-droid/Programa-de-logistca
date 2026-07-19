export function MapLegend() {
  return (
    <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-neutral-300 backdrop-blur-sm">
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[#E8823C]" /> Sitio
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[#3DDC97]" /> Activo
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[#D9455F]" /> Alerta
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[#fbbf24]" /> Revisión
      </span>
    </div>
  );
}
