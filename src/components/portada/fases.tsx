/**
 * «_proceso»: tres fases a lo alto, como capítulos. Cada una con su nombre en
 * sans y la palabra clave en cursiva serif, un texto corto y una muestra de la
 * pantalla real. Sin JavaScript.
 */
import Link from "next/link";

const FASES = [
  {
    id: "diagnostico",
    articulo: "El",
    nombre: "diagnóstico",
    texto:
      "Todo empieza con 20 minutos. Tres preguntas de cada sección, sin crear cuenta, y sales con lo que dominas, lo que está en desarrollo y tus 3 prioridades.",
    enlace: { href: "/mini", txt: "Hacer el mini diagnóstico" },
  },
  {
    id: "practica",
    articulo: "La",
    nombre: "práctica",
    texto:
      "Diez preguntas al día de lo que más te hace falta. Cada opción trae su porqué, también las incorrectas, y lo que fallas vuelve a los 1, 3 y 7 días.",
    enlace: { href: "/planes", txt: "Ver qué incluye gratis" },
  },
  {
    id: "simulacro",
    articulo: "El",
    nombre: "simulacro",
    texto:
      "Todo seguido y con un solo cronómetro, como el día del examen. Al final, tu calificación estimada y la revisión pregunta por pregunta.",
    enlace: { href: "/guia", txt: "Leer la guía del examen" },
  },
] as const;

export function Fases() {
  return (
    <ol className="fases">
      {FASES.map((f, i) => (
        <li key={f.id} className="fase">
          <div className="fase-texto">
            <span className="joa-etiqueta">_fase_{i + 1}</span>
            <h3>
              {f.articulo} <em>{f.nombre}</em>
            </h3>
            <p>{f.texto}</p>
            <Link href={f.enlace.href} className="joa-enlace">
              {f.enlace.txt}
            </Link>
          </div>
          <div className="fase-muestra" aria-hidden>
            <Muestra id={f.id} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Muestra({ id }: { id: string }) {
  if (id === "diagnostico")
    return (
      <div className="muestra-reporte">
        {[
          ["Comprensión lectora", 89, "ok"],
          ["Pensamiento matemático", 56, "mid"],
          ["Redacción indirecta", 43, "bad"],
        ].map(([n, v, c]) => (
          <div key={n} className="muestra-fila">
            <span>{n}</span>
            <span className="muestra-barra">
              <i className={c as string} style={{ width: `${v}%` }} />
            </span>
            <b>{v} %</b>
          </div>
        ))}
        <p>Prioridad 1: Redacción indirecta</p>
      </div>
    );
  if (id === "practica")
    return (
      <div className="muestra-practica">
        <p>Pregunta 4 de 10</p>
        <div className="muestra-op">
          A · Porque perjudica a quien no tiene otro dispositivo
        </div>
        <div className="muestra-op bien">
          B · Es preferible regular el uso que prohibirlo
        </div>
        <div className="muestra-op">C · El celular causa la distracción</div>
        <p className="muestra-porque">
          Por qué sí: es la tesis que el autor defiende en el último párrafo.
        </p>
      </div>
    );
  return (
    <div className="muestra-reloj">
      <b>2:58:41</b>
      <span>Simulacro completo · 190 preguntas</span>
    </div>
  );
}
