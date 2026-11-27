"use client";
/**
 * Línea de avance de la portada, pegada al borde de arriba. Antes había además
 * una barra flotante abajo con las secciones, pero duplicaba el encabezado y
 * tapaba el texto (sobre todo los precios), así que se quitó.
 */
import { useEffect, useRef } from "react";

export function BarraAvance() {
  const barra = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let cuadro = 0;
    const avance = () => {
      cuadro = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      barra.current?.style.setProperty("--avance", String(max > 0 ? scrollY / max : 0));
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(avance);
    };
    addEventListener("scroll", pedir, { passive: true });
    return () => {
      removeEventListener("scroll", pedir);
      cancelAnimationFrame(cuadro);
    };
  }, []);
  return <span ref={barra} className="joa-avance" aria-hidden />;
}
