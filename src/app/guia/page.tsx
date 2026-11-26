import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ciclo } from "@/lib/consultas";
import { formatoFecha } from "@/lib/fechas";
import {
  Encabezado,
  HeroEditorial,
  Marquesina,
} from "@/components/estilos/editorial";

export const metadata: Metadata = {
  title: "Guía del EXANI-II para Medicina",
  description:
    "Qué evalúa el EXANI-II, cómo se reparte el tiempo y cómo prepararte por subáreas, en un plan sencillo.",
};
export const revalidate = 3600;

const AREAS = [
  [
    "Comprensión lectora",
    "Leer textos de estudio, literarios y de participación social, y entender qué dicen, cómo lo dicen y para qué.",
  ],
  [
    "Redacción indirecta",
    "Reconocer cómo se escribe bien: orden de ideas, puntuación, concordancia y conectores, sin tener que redactar tú.",
  ],
  [
    "Pensamiento matemático",
    "Entender conceptos y pasar situaciones a operaciones: proporciones, álgebra, geometría y datos.",
  ],
  [
    "Habilidades blandas y toma de decisiones",
    "Solo en la BUAP (22 reactivos): razonamiento con patrones, pensamiento crítico y cómo decidir en equipo y bajo presión.",
  ],
  [
    "Inglés",
    "Lo presentan todos (30 reactivos), pero es diagnóstico: no suma a tu puntaje.",
  ],
  [
    "Módulos de tu área",
    "En la BUAP, un módulo general (Ciencias sociales o Ciencias experimentales) y el módulo de tu área de conocimiento, de 24 reactivos cada uno.",
  ],
  [
    "Medicina BUAP",
    "Va aparte, en dos etapas: primero Premedicina (48) y Razonamiento clínico avanzado (20); después las cinco áreas comunes.",
  ],
];

const PLAN: [string, string][] = [
  [
    "Haz un diagnóstico.",
    "Te dice, subárea por subárea, dónde estás fuerte y dónde se te van los puntos.",
  ],
  [
    "Empieza por la prioridad 1.",
    "Es la subárea que más puntos te puede dar: pesa mucho en el examen y es donde fallas más.",
  ],
  [
    "Practica poco y diario.",
    "Quince preguntas al día rinden más que tres horas el domingo. La racha está para eso.",
  ],
  [
    "Repasa tus errores.",
    "Te los regresamos a los 1, 3 y 7 días para que no se te vuelvan a escapar.",
  ],
  [
    "Haz un simulacro con tiempo",
    "unas semanas antes, para acostumbrarte al ritmo y al cansancio.",
  ],
];

export default async function Guia() {
  const c = await ciclo().catch(() => null);
  return (
    <div className="editorial">
      <HeroEditorial
        ceja="Guía del sustentante, en corto"
        titulo={
          <>
            Cómo es
            <br /> el examen
          </>
        }
        sub={
          <>
            No mide si memorizaste la prepa: <u>mide si sabes razonar</u>
          </>
        }
        cifras={[
          ["190", "Reactivos en la BUAP"],
          ["5 h", "Tiempo máximo"],
          ["3", "Opciones por pregunta"],
          ["0", "Puntos menos por error"],
        ]}
      />

      <Marquesina etiqueta="Áreas que evalúa" items={AREAS.map(([a]) => a)} />

      <section className="ed-papel">
        <div className="wrap">
          <Encabezado
            ceja="Qué se evalúa"
            titulo={
              <>
                Siete piezas, <span className="ed-acento">un solo</span> examen.
              </>
            }
          >
            <p className="ed-intro">
              El EXANI-II lo aplica el CENEVAL y muchas universidades lo usan
              para decidir quién entra.{" "}
              {c?.fechaExamen
                ? `La fecha que tenemos para el ciclo ${c.anio} es el ${formatoFecha(c.fechaExamen)}. Confírmala siempre en la convocatoria oficial de tu universidad.`
                : "Todavía no hay fecha oficial para el próximo ciclo. Cuando salga la convocatoria de tu universidad, la ponemos aquí y en tu cuenta regresiva."}
            </p>
          </Encabezado>
          <ol className="ed-tarjetas">
            {AREAS.map(([a, d], i) => (
              <li key={a}>
                <span className="ed-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
          <p className="ed-letra-chica">
            Todas las preguntas son de opción múltiple con tres respuestas y una
            sola correcta. No se resta por equivocarte, así que conviene no
            dejar ninguna en blanco. La estructura exacta, el número de
            preguntas y el tiempo vienen en la guía oficial del sustentante, que
            publica el CENEVAL.{" "}
            <Link href="/areas">
              Ve el temario, la bibliografía y una pregunta resuelta de cada
              área
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="ed-oscuro">
        <div className="wrap">
          <Encabezado
            ceja="Nuestro método"
            titulo={
              <>
                Un plan que <span className="ed-acento">sí se sostiene.</span>
              </>
            }
          />
          <div className="ed-con-foto">
            <figure className="ed-foto">
              <Image
                src="/imagenes/practica-en-aula.webp"
                alt="Estudiantes en un salón resolviendo ejercicios en sus computadoras portátiles"
                width={474}
                height={316}
                sizes="(max-width: 800px) 100vw, 474px"
              />
            </figure>
            <ol className="ed-pasos">
              {PLAN.map(([b, t], i) => (
                <li key={b}>
                  <span className="ed-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p>
                    <b>{b}</b> {t}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="ed-cierre">
        <div className="wrap">
          <span className="ed-ojo">El momento es ahora</span>
          <h2 className="ed-h2">
            ¿Listo para saber <span className="ed-acento">dónde estás?</span>
          </h2>
          <p className="ed-intro">
            Dieciocho preguntas, veinte minutos y sin registrarte.
          </p>
          <div className="fila" style={{ justifyContent: "center" }}>
            <Link className="ed-boton" href="/mini">
              Probar el mini diagnóstico
            </Link>
            <Link className="ed-boton sec" href="/carreras/medicina">
              Ver preguntas resueltas
            </Link>
          </div>
          <p className="ed-letra-chica">
            Estudiar es Clave no tiene relación con el CENEVAL ni con ninguna
            universidad. Nuestras preguntas son originales.
          </p>
        </div>
      </section>
    </div>
  );
}
