"use client";
/**
 * Profe Tomás: la pila de libros de la marca con birrete. Acompaña al alumno
 * mientras contesta: cambia de cara según lo que pasa y habla en un globo.
 * Dibujo propio en SVG (mismo trazo que la mascota de redes) para que pese
 * poco, se vea nítido en cualquier pantalla y pueda gesticular.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type Animo = "neutral" | "feliz" | "festejo" | "animo" | "pensando" | "sorpresa";

const BOCAS: Record<Animo, React.ReactNode> = {
  neutral: <path d="M86 64h28a14 12 0 0 1-28 0z" className="profe-boca" />,
  feliz: <path d="M82 62h36a18 16 0 0 1-36 0z" className="profe-boca" />,
  festejo: (
    <>
      <path d="M78 61h44a22 20 0 0 1-44 0z" className="profe-boca" />
      <path d="M90 74a10 6 0 0 1 20 0" fill="#ff8a7e" />
    </>
  ),
  animo: <path d="M88 70q12-8 24 0" className="profe-linea" />,
  pensando: <path d="M92 68h14" className="profe-linea" />,
  sorpresa: <ellipse cx="100" cy="68" rx="7" ry="8" className="profe-boca" />,
};

/** Hacia dónde mira cada ánimo (desplazamiento de las pupilas). */
const MIRADA: Record<Animo, [number, number]> = {
  neutral: [3, 3],
  feliz: [2, 1],
  festejo: [0, 0],
  animo: [0, 4],
  pensando: [6, -6],
  sorpresa: [0, 0],
};

export function ProfeTomas({ animo = "neutral", className }: { animo?: Animo; className?: string }) {
  const [dx, dy] = MIRADA[animo];
  const contento = animo === "festejo";
  return (
    <svg viewBox="0 0 200 160" className={`profe-svg profe-${animo} ${className ?? ""}`} aria-hidden>
      <g className="profe-cuerpo">
        {/* Pila de libros, de abajo hacia arriba. */}
        <rect x="18" y="126" width="146" height="26" rx="5" fill="#30a3d0" className="profe-trazo" />
        <rect x="8" y="96" width="160" height="26" rx="5" fill="#2080b0" className="profe-trazo" />
        <path d="M26 104h20M26 113h12" className="profe-detalle" />
        <rect x="22" y="58" width="142" height="34" rx="5" fill="#e9d8ef" className="profe-trazo" />
        <rect x="14" y="26" width="150" height="28" rx="5" fill="#3ecff3" className="profe-trazo" />
        {/* Birrete. */}
        <g className="profe-birrete">
          <path d="M92 2l46 12-46 12-46-12z" fill="#0b1d2e" />
          <path d="M66 19v9q26 9 52 0v-9" fill="#0b1d2e" />
          <path d="M92 14l36 4v18" className="profe-borla" />
          <circle cx="128" cy="38" r="4" fill="#00c5f4" />
        </g>
        {/* Ojos. */}
        {contento ? (
          <>
            <path d="M54 44q14-18 28 0" className="profe-ojo-feliz" />
            <path d="M118 44q14-18 28 0" className="profe-ojo-feliz" />
          </>
        ) : (
          <g className="profe-ojos">
            <circle cx="68" cy="40" r="18" fill="#fff" className="profe-trazo" />
            <circle cx="132" cy="40" r="18" fill="#fff" className="profe-trazo" />
            <circle cx={68 + dx} cy={40 + dy} r="7.5" fill="#0b1d2e" />
            <circle cx={132 + dx} cy={40 + dy} r="7.5" fill="#0b1d2e" />
            {animo === "animo" && (
              <>
                <path d="M52 18l26 6" className="profe-ceja" />
                <path d="M148 18l-26 6" className="profe-ceja" />
              </>
            )}
          </g>
        )}
        {BOCAS[animo]}
        {(animo === "feliz" || animo === "festejo") && (
          <>
            <ellipse cx="46" cy="72" rx="8" ry="5" fill="#ff8a7e" opacity=".55" />
            <ellipse cx="146" cy="72" rx="8" ry="5" fill="#ff8a7e" opacity=".55" />
          </>
        )}
      </g>
      {contento && (
        <g className="profe-chispas">
          <path d="M14 10l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f2b35a" />
          <path d="M184 52l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#5fd08f" />
          <path d="M178 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#00c5f4" />
        </g>
      )}
    </svg>
  );
}

const CLAVE_OCULTO = "eec:profe-oculto";

/**
 * Rincón del profe: la mascota y su globo de diálogo. Se puede ocultar y la
 * preferencia se guarda en el teléfono.
 */
export function Profe({ animo, mensaje, clave }: { animo: Animo; mensaje: string; clave: string | number }) {
  const [oculto, setOculto] = useState(false);
  useEffect(() => {
    try {
      // Preferencia guardada en el navegador (sistema externo).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOculto(localStorage.getItem(CLAVE_OCULTO) === "1");
    } catch {}
  }, []);
  const cambiar = (v: boolean) => {
    setOculto(v);
    try {
      localStorage.setItem(CLAVE_OCULTO, v ? "1" : "0");
    } catch {}
  };

  if (oculto)
    return (
      <button className="profe-mostrar" onClick={() => cambiar(false)} aria-label="Mostrar al Profe Tomás">
        <ProfeTomas animo="neutral" />
        <span>Profe</span>
      </button>
    );

  return (
    <aside className={`profe profe-estado-${animo}`} aria-label="Profe Tomás">
      <ProfeTomas animo={animo} className="profe-mascota" key={`m-${clave}`} />
      <div className="profe-globo" key={`g-${clave}`}>
        <span className="profe-nombre">Profe Tomás</span>
        <p aria-live="polite">{mensaje}</p>
      </div>
      <button className="profe-cerrar" onClick={() => cambiar(true)} aria-label="Ocultar al profe" title="Ocultar al profe">
        <X size={14} aria-hidden />
      </button>
    </aside>
  );
}
