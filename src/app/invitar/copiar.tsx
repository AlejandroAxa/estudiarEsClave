"use client";
import { useState } from "react";

export function CopiarEnlace({ url, mensaje }: { url: string; mensaje: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="pila">
      <code style={{ wordBreak: "break-all" }}>{url}</code>
      <div className="fila">
        <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer">
          Mandar por WhatsApp
        </a>
        <button
          className="btn sec"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopiado(true);
          }}
        >
          {copiado ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
