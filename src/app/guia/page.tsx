import type { Metadata } from "next";
import Link from "next/link";
import { ciclo } from "@/lib/consultas";
import { formatoFecha } from "@/lib/fechas";

export const metadata: Metadata = {
  title: "Guía del EXANI-II para Medicina",
  description: "Qué evalúa el EXANI-II, cómo se reparte el tiempo y cómo prepararte por subáreas, en un plan sencillo.",
};
export const revalidate = 3600;

const AREAS = [
  ["Comprensión lectora", "Leer textos de estudio, literarios y de participación social, y entender qué dicen, cómo lo dicen y para qué."],
  ["Redacción indirecta", "Reconocer cómo se escribe bien: orden de ideas, puntuación, concordancia y conectores, sin tener que redactar tú."],
  ["Pensamiento matemático", "Entender conceptos y pasar situaciones a operaciones: proporciones, álgebra, geometría y datos."],
  ["Habilidades blandas y toma de decisiones", "Solo en la BUAP (22 reactivos): razonamiento con patrones, pensamiento crítico y cómo decidir en equipo y bajo presión."],
  ["Inglés", "Lo presentan todos (30 reactivos), pero es diagnóstico: no suma a tu puntaje."],
  ["Módulos de tu área", "En la BUAP, un módulo general (Ciencias sociales o Ciencias experimentales) y el módulo de tu área de conocimiento, de 24 reactivos cada uno."],
  ["Medicina BUAP", "Va aparte, en dos etapas: primero Premedicina (48) y Razonamiento clínico avanzado (20); después las cinco áreas comunes."],
];

export default async function Guia() {
  const c = await ciclo().catch(() => null);
  return (
    <div className="wrap band pila angosto lectura">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Cómo es el examen</h1>
      <p className="lead">
        El EXANI-II lo aplica el CENEVAL y muchas universidades lo usan para decidir quién entra. No mide si memorizaste la prepa: mide si sabes
        leer, razonar y usar lo básico de tu área.
      </p>
      <p>
        {c?.fechaExamen
          ? `La fecha que tenemos para el ciclo ${c.anio} es el ${formatoFecha(c.fechaExamen)}. Confírmala siempre en la convocatoria oficial de tu universidad.`
          : "Todavía no hay fecha oficial para el próximo ciclo. Cuando salga la convocatoria de tu universidad, la ponemos aquí y en tu cuenta regresiva."}
      </p>
      <h2>Qué se evalúa</h2>
      <table className="tabla">
        <tbody>
          {AREAS.map(([a, d]) => (
            <tr key={a}>
              <th scope="row">{a}</th>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small">
        Todas las preguntas son de opción múltiple con tres respuestas y una sola correcta. No se resta por equivocarte, así que conviene no dejar
        ninguna en blanco. La estructura exacta, el número de preguntas y el tiempo vienen en la guía oficial del sustentante, que publica el CENEVAL.
      </p>
      <p>
        <Link href="/areas">Ve el temario, la bibliografía y una pregunta resuelta de cada área y módulo, con la estructura de la BUAP</Link>.
      </p>
      <h2>Un plan que sí se sostiene</h2>
      <ol>
        <li>
          <b>Haz un diagnóstico.</b> Te dice, subárea por subárea, dónde estás fuerte y dónde se te van los puntos.
        </li>
        <li>
          <b>Empieza por la prioridad 1.</b> Es la subárea que más puntos te puede dar: pesa mucho en el examen y es donde fallas más.
        </li>
        <li>
          <b>Practica poco y diario.</b> Quince preguntas al día rinden más que tres horas el domingo. La racha está para eso.
        </li>
        <li>
          <b>Repasa tus errores.</b> Te los regresamos a los 1, 3 y 7 días para que no se te vuelvan a escapar.
        </li>
        <li>
          <b>Haz un simulacro con tiempo</b> unas semanas antes, para acostumbrarte al ritmo y al cansancio.
        </li>
      </ol>
      <div className="fila">
        <Link className="btn" href="/mini">
          Probar 18 preguntas sin registrarte
        </Link>
        <Link className="btn sec" href="/carreras/medicina">
          Ver preguntas resueltas
        </Link>
      </div>
      <p className="xs">Estudiar es Clave no tiene relación con el CENEVAL ni con ninguna universidad. Nuestras preguntas son originales.</p>
    </div>
  );
}
