import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buzonLocal, buzonLocalActivo } from "@/lib/correo";
import { formatoHora } from "@/lib/fechas";

export const metadata: Metadata = { title: "Buzón local", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Solo para probar en Docker sin servicio de correo (CORREO_LOCAL=1). */
export default function BuzonLocal() {
  if (!buzonLocalActivo()) notFound();
  const correos = buzonLocal();
  return (
    <div className="angosto band pila" style={{ maxWidth: 640 }}>
      <span className="pastilla">Solo en tu computadora</span>
      <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>Buzón local</h1>
      <p className="lead">
        Como en Docker no hay servicio de correo, los enlaces para entrar aparecen aquí. Ábrelo en este mismo navegador. Vence en 15 minutos y sirve
        una vez.
      </p>
      {correos.length === 0 && (
        <p className="small">
          Todavía no hay correos. <Link href="/entrar">Pide tu enlace</Link> y vuelve a esta página.
        </p>
      )}
      {correos.map((c, i) => (
        <article key={i} className="hoja pila">
          <span className="xs">
            {formatoHora(c.en)} · para {c.para}
          </span>
          <h2 style={{ fontSize: 20, margin: 0 }}>{c.asunto}</h2>
          {c.enlace ? (
            <a className="btn chico" href={c.enlace} style={{ alignSelf: "start" }}>
              Abrir el enlace
            </a>
          ) : (
            <pre className="small" style={{ whiteSpace: "pre-wrap" }}>{c.texto}</pre>
          )}
        </article>
      ))}
    </div>
  );
}
