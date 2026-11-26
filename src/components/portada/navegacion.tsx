"use client";
/**
 * Barra flotante abajo al centro, con la marca y las secciones de la portada,
 * más una línea de avance arriba. Aparece cuando el horizonte ya salió de la
 * pantalla, para no tapar sus botones.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SECCIONES = [
  ["#manifiesto", "Manifiesto"],
  ["#areas", "Áreas"],
  ["#proceso", "Proceso"],
  ["#precios", "Precios"],
] as const;

export function NavegacionFlotante() {
  const [visible, setVisible] = useState(false);
  const barra = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const hero = document.getElementById("portada-hero");
    let cuadro = 0;
    const avance = () => {
      cuadro = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      barra.current?.style.setProperty(
        "--avance",
        String(max > 0 ? scrollY / max : 0),
      );
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(avance);
    };
    addEventListener("scroll", pedir, { passive: true });
    if (!hero) return () => removeEventListener("scroll", pedir);
    const io = new IntersectionObserver(
      ([e]) => setVisible(!e.isIntersecting),
      { threshold: 0.1 },
    );
    io.observe(hero);
    return () => {
      io.disconnect();
      removeEventListener("scroll", pedir);
      cancelAnimationFrame(cuadro);
    };
  }, []);
  return (
    <>
      <span ref={barra} className="joa-avance" aria-hidden />
      <nav
        className={`joa-nav ${visible ? "" : "oculta"}`}
        aria-label="Secciones de la portada"
        aria-hidden={!visible}
      >
        <a
          href="#portada-hero"
          className="joa-nav-marca"
          tabIndex={visible ? undefined : -1}
        >
          CLAVE®
        </a>
        {SECCIONES.map(([h, t]) => (
          <a
            key={h}
            href={h}
            className="joa-nav-enlace"
            tabIndex={visible ? undefined : -1}
          >
            {t}
          </a>
        ))}
        <Link
          href="/mini"
          className="joa-nav-accion"
          tabIndex={visible ? undefined : -1}
        >
          Empezar
        </Link>
      </nav>
    </>
  );
}
