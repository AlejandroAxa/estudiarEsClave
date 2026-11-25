"use client";
/**
 * «Cómo funciona»: tres paneles en fila. El abierto muestra su explicación y
 * una muestra de la pantalla; los cerrados quedan como columnas con su nombre
 * en vertical. En celular se apilan.
 */
import { useState } from "react";
import Link from "next/link";

const PANELES = [
  {
    id: "diagnostico",
    nombre: "Diagnóstico",
    color: "#E9D8EF",
    texto: "Tres preguntas de cada sección en 20 minutos, sin crear cuenta. Sales con lo que dominas, lo que está en desarrollo y tus 3 prioridades.",
    enlace: { href: "/mini", txt: "Hacer el mini diagnóstico" },
  },
  {
    id: "practica",
    nombre: "Práctica",
    color: "#F7C59F",
    texto: "10 preguntas al día de lo que más te hace falta. Cada opción trae su porqué, también las incorrectas, y lo que fallas vuelve a los 1, 3 y 7 días.",
    enlace: { href: "/planes", txt: "Ver qué incluye gratis" },
  },
  {
    id: "simulacro",
    nombre: "Simulacro",
    color: "#9CC9F5",
    texto: "Todo seguido y con un solo cronómetro, como el día del examen. Al final, tu calificación estimada y la revisión pregunta por pregunta.",
    enlace: { href: "/guia", txt: "Leer la guía del examen" },
  },
] as const;

export function Servicios() {
  const [abierto, setAbierto] = useState<string>("diagnostico");
  return (
    <div className="servicios">
      {PANELES.map((p) => {
        const activo = p.id === abierto;
        return (
          <article key={p.id} className={`servicio ${activo ? "abierto" : ""}`} style={{ "--tono": p.color } as React.CSSProperties}>
            <button
              type="button"
              className="servicio-pestana"
              aria-expanded={activo}
              aria-controls={`servicio-${p.id}`}
              onClick={() => setAbierto(p.id)}
              onMouseEnter={() => setAbierto(p.id)}
            >
              <span>{p.nombre}</span>
            </button>
            <div className="servicio-cuerpo" id={`servicio-${p.id}`} hidden={!activo}>
              <div className="servicio-texto">
                <h3>{p.nombre}</h3>
                <p>{p.texto}</p>
                <Link href={p.enlace.href} className="enlace-flecha">
                  {p.enlace.txt}
                </Link>
              </div>
              <div className="servicio-muestra" aria-hidden>
                <Muestra id={p.id} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
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
        <div className="muestra-op">A · Porque perjudica a quien no tiene otro dispositivo</div>
        <div className="muestra-op bien">B · Es preferible regular el uso que prohibirlo</div>
        <div className="muestra-op">C · El celular causa la distracción</div>
        <p className="muestra-porque">Por qué sí: es la tesis que el autor defiende en el último párrafo.</p>
      </div>
    );
  return (
    <div className="muestra-reloj">
      <b>2:58:41</b>
      <span>Simulacro completo · 190 preguntas</span>
    </div>
  );
}
