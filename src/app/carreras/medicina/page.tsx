import type { Metadata } from "next";
import Link from "next/link";
import { muestrasPublicas } from "@/lib/consultas";

export const metadata: Metadata = {
  title: "EXANI-II para Medicina: preguntas resueltas",
  description: "Tres preguntas originales tipo EXANI-II para Medicina, resueltas y explicadas, y un diagnóstico gratis por subáreas.",
};
export const revalidate = 3600;

export default async function Medicina() {
  const muestras = await muestrasPublicas("medicina", 3).catch(() => []);
  return (
    <div className="wrap band pila angosto">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Medicina</h1>
      <p className="lead">
        Para Medicina se evalúan las áreas generales y además Biología, Química y Premedicina. Aquí tienes tres preguntas resueltas para que veas
        el estilo.
      </p>
      {muestras.length === 0 && <p className="small">Las preguntas de muestra aparecen en cuanto se publique el banco.</p>}
      {muestras.map((m, i) => (
        <article key={m.id} className="hoja pila">
          <span className="membrete">
            Pregunta {i + 1} · {m.area}
          </span>
          <p className="pregunta">{m.enunciado}</p>
          <ol className="opciones" type="A">
            {m.opciones.map((o) => (
              <li key={o.opcionId} className={`opcion${o.correcta ? " correcta" : ""}`}>
                {o.texto}
                {o.correcta && <span className="sem ok"> Correcta</span>}
                {!o.correcta && o.argumentacion && <span className="small"> · {o.argumentacion}</span>}
              </li>
            ))}
          </ol>
          {m.explicacion && (
            <div className="porque">
              <b>Por qué:</b> {m.explicacion}
            </div>
          )}
        </article>
      ))}
      <div className="fila">
        <Link className="btn" href="/mini">
          Hacer 18 preguntas sin registrarme
        </Link>
        <Link className="btn sec" href="/entrar">
          Crear cuenta y hacer el diagnóstico
        </Link>
      </div>
    </div>
  );
}
