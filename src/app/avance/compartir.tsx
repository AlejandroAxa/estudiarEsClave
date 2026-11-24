"use client";
import { useActionState, useState } from "react";
import { compartirAvance } from "@/app/acciones/compartir";

export function Compartir() {
  const [estado, accion, enviando] = useActionState(compartirAvance, undefined);
  const [copiado, setCopiado] = useState(false);
  if (estado?.url) {
    const msg = `Así va mi preparación para el examen de admisión: ${estado.url}`;
    return (
      <div className="pila">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={estado.imagen} alt="Gráfica de tu avance" style={{ borderRadius: 6, boxShadow: "var(--sheet)", width: "100%", maxWidth: 600 }} />
        <div className="fila">
          <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
            Mandar por WhatsApp
          </a>
          <a className="btn sec" href={`mailto:?subject=${encodeURIComponent("Mi avance en Estudiar es Clave")}&body=${encodeURIComponent(msg)}`}>
            Mandar por correo
          </a>
          <button
            className="btn disc"
            onClick={async () => {
              if (navigator.share) await navigator.share({ title: "Mi avance", text: msg, url: estado.url }).catch(() => {});
              else {
                await navigator.clipboard.writeText(estado.url!);
                setCopiado(true);
              }
            }}
          >
            {copiado ? "Copiado" : "Compartir o copiar"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <form action={accion}>
      {estado?.error && <p className="aviso error">{estado.error}</p>}
      <button className="btn" disabled={enviando}>
        {enviando ? "Generando…" : "Generar gráfica y enlace"}
      </button>
    </form>
  );
}
