import type { Metadata } from "next";
import Link from "next/link";
import { Enunciado, Explicacion, Formula } from "@/components/formula";
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
      <nav className="migas migas-claras" aria-label="Ruta">
        <Link href="/carreras">Áreas generales</Link> <span aria-hidden>/</span>{" "}
        <Link href="/carreras/ciencias-naturales-y-de-salud">Ciencias Naturales y de Salud</Link> <span aria-hidden>/</span> <span>Medicina</span>
      </nav>
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Medicina</h1>
      <p className="lead">
        En la BUAP, Medicina tiene su propia evaluación en dos etapas: primero{" "}
        <Link href="/areas/premedicina">Premedicina</Link> (48 reactivos) y{" "}
        <Link href="/areas/razonamiento-clinico-avanzado">Razonamiento clínico avanzado</Link> (20); después las áreas que presentan todos,
        incluida <Link href="/areas/habilidades-blandas">Habilidades blandas</Link>. En total son 210. Aquí tienes tres preguntas resueltas para
        que veas el estilo.
      </p>
      {muestras.length === 0 && <p className="small">Las preguntas de muestra aparecen en cuanto se publique el banco.</p>}
      {muestras.map((m, i) => (
        <article key={m.id} className="hoja pila">
          <span className="membrete">
            Pregunta {i + 1} · {m.area}
          </span>
          <Enunciado texto={m.enunciado} />
          <ol className="opciones" type="A">
            {m.opciones.map((o) => (
              <li key={o.opcionId} className={`opcion${o.correcta ? " correcta" : ""}`}>
                <Formula texto={o.texto} />
                {o.correcta && <span className="sem ok"> Correcta</span>}
                {!o.correcta && o.argumentacion && <span className="small"> · <Formula texto={o.argumentacion} /></span>}
              </li>
            ))}
          </ol>
          {m.explicacion && (
            <div className="porque">
              <b>Por qué:</b> <Explicacion texto={m.explicacion} />
            </div>
          )}
        </article>
      ))}
      <div className="fila">
        <Link className="btn" href="/mini?area=medicina">
          Hacer 18 preguntas sin registrarme
        </Link>
        <Link className="btn sec" href="/diagnostico?area=medicina">
          Crear cuenta y hacer el diagnóstico
        </Link>
      </div>
    </div>
  );
}
