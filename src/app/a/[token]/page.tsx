import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { buscarEnlaceAvance, type DatosAvance } from "@/lib/compartir";
import { formatoFecha } from "@/lib/fechas";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  return { title: "Avance de estudio", robots: { index: false, follow: false }, openGraph: { images: [`/a/${token}/imagen`] } };
}

/** Vista de solo lectura de un enlace de avance: la gráfica congelada y nada más. */
export default async function AvanceCompartido({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const e = await buscarEnlaceAvance(db, token);
  if (!e)
    return (
      <div className="angosto band">
        <h1 style={{ fontSize: 36 }}>Este enlace ya no está disponible</h1>
        <p className="lead">Venció o quien lo compartió lo revocó.</p>
      </div>
    );
  const d = e.datos as DatosAvance;
  return (
    <div className="angosto band pila">
      <span className="pastilla">Expediente compartido</span>
      <h1 style={{ fontSize: "clamp(30px,5vw,48px)" }}>Avance de {d.nombre}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={e.imagenUrl ?? `/a/${token}/imagen`} alt={`Gráfica de avance de ${d.nombre}`} style={{ width: "100%", borderRadius: 6, boxShadow: "var(--sheet)" }} />
      <p className="small">
        Gráfica del {formatoFecha(new Date(d.generado))}. {d.diagnosticos} diagnósticos, {d.temasEstudiados} temas y {d.preguntasPracticadas} preguntas de práctica.
        Calificación estimada por Estudiar es Clave; no es un puntaje del CENEVAL.
      </p>
      <p>
        ¿Quieres apoyar su preparación? Pídele que te mande un enlace de pago desde su cuenta. <Link href="/planes">Ver planes</Link>
      </p>
    </div>
  );
}
