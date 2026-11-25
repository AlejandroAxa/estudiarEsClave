"use client";
/** Acceso fijo al mini diagnóstico. Aparece cuando el titular ya salió de la pantalla, para no tapar sus botones. */
import { useEffect, useState } from "react";
import Link from "next/link";

export function PildoraFlotante() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("portada-hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), { threshold: 0.15 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return (
    <Link href="/mini" className={`pildora-flotante ${visible ? "" : "oculta"}`} aria-hidden={!visible} tabIndex={visible ? undefined : -1}>
      ¿Empezamos?
    </Link>
  );
}
