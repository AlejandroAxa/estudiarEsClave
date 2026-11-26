"use client";
/**
 * Texto que se enciende palabra por palabra mientras bajas, como quien lo lee
 * en voz alta. Una sola variable (--p, de 0 a 1) por bloque; cada palabra
 * calcula su brillo en CSS. Sin movimiento reducido, todo queda encendido.
 */
import { useEffect, useRef } from "react";

export function Lectura({
  texto,
  className = "",
}: {
  texto: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const palabras = texto.split(" ");
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el?.style.setProperty("--p", "1");
      return;
    }
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      const r = el.getBoundingClientRect();
      const alto = innerHeight;
      // Empieza cuando el bloque asoma por abajo y termina cuando su final pasa la mitad de la pantalla.
      const p = (alto * 0.9 - r.top) / (r.height + alto * 0.4);
      el.style.setProperty("--p", String(Math.min(1, Math.max(0, p))));
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir);
    };
    medir();
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    return () => {
      removeEventListener("scroll", pedir);
      removeEventListener("resize", pedir);
      cancelAnimationFrame(cuadro);
    };
  }, []);
  return (
    <p
      ref={ref}
      className={`lectura ${className}`}
      style={{ "--n": palabras.length } as React.CSSProperties}
    >
      {palabras.map((w, k) => (
        <span key={k} style={{ "--k": k } as React.CSSProperties}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
