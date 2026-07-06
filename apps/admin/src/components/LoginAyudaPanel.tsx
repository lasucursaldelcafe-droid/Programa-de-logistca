import { useState } from "react";
import { Link } from "react-router-dom";
import { InstruccionesOperacion, type Platform } from "./InstruccionesOperacion";

interface LoginAyudaPanelProps {
  platform: Platform;
}

export function LoginAyudaPanel({ platform }: LoginAyudaPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-6 rounded-lg border border-border bg-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-neutral-200"
      >
        <span>Instrucciones de operación</span>
        <span className="text-neutral-500">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-border px-3 py-3">
          <InstruccionesOperacion platform={platform} compact />
          <p className="mt-3 border-t border-border pt-3 text-xs">
            <Link to="/ayuda" className="text-accent hover:underline">
              Ver guía completa →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
