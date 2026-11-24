import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

const PREGUNTAS: [string, React.ReactNode][] = [
  ["¿Las preguntas son las del examen real?", "No. Todas son originales y las revisa un docente antes de publicarse. Siguen la estructura del examen para que practiques lo que se evalúa, pero no copiamos reactivos del CENEVAL ni de libros."],
  ["¿Qué incluye el plan gratis?", "Un diagnóstico por temporada, 15 preguntas de práctica al día, tu racha con una protección al mes y la liga semanal. Al registrarte tienes además 3 días con todo abierto, sin poner tarjeta."],
  ["¿Qué diferencia hay entre el Pase Básico y el Paquete Medicina?", "El Pase Básico abre sin límite las áreas generales: Comprensión lectora, Redacción indirecta y Pensamiento matemático. El Paquete Medicina abre todo, incluidos Biología, Química y Premedicina, además de los simulacros."],
  ["¿Cómo es el examen en la BUAP?", <>Eliges una de cuatro áreas de conocimiento: Económico Administrativas, Sociales y Humanidades, Naturales y de Salud, o Ingenierías y Ciencias Exactas. Todas presentan Comprensión lectora, Redacción indirecta y Pensamiento matemático (30 cada una), Habilidades blandas y toma de decisiones (22) e Inglés diagnóstico (30), más dos módulos de 24 según tu área: 190 reactivos. Medicina va aparte y suma 210. Lo tienes completo en <Link href="/areas">Áreas del examen</Link>.</>],
  ["¿Es una suscripción?", "No. Pagas una vez y el acceso dura hasta el día de tu examen. No hay cobros automáticos."],
  ["¿Cómo puedo pagar?", "Con tarjeta, en OXXO o por transferencia SPEI, a través de Mercado Pago. Si alguien de tu familia va a pagar, puedes mandarle un enlace de pago por WhatsApp o correo."],
  ["¿Cómo se calcula mi calificación?", "Con una regla fija: cada subárea pesa lo mismo que en el examen y tu calificación es el porcentaje ponderado de aciertos. No usamos inteligencia artificial para calificarte y el mismo examen siempre da el mismo resultado."],
  ["¿Mi calificación garantiza que voy a entrar?", "No. Es una estimación de cómo vas, no una predicción del puntaje oficial. Lo útil es ver qué subárea estudiar primero y comprobar que mejoras."],
  ["¿Quién ve mis datos?", <>Nadie más que tú. En la liga solo aparece tu alias, y cuando compartes tu avance decides con quién y puedes revocar el enlace. Puedes descargar o borrar tus datos desde tu cuenta. Lee el <Link href="/privacidad">aviso de privacidad</Link>.</>],
  ["Encontré una pregunta con error", "Gracias. Usa el botón «Reportar un error» debajo de la pregunta. La revisamos y, si tiene razón, la corregimos en la siguiente versión del banco."],
];

export default function Preguntas() {
  return (
    <div className="wrap band pila angosto lectura">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Preguntas frecuentes</h1>
      {PREGUNTAS.map(([p, r]) => (
        <details key={p} className="hoja">
          <summary>
            <b>{p}</b>
          </summary>
          <p style={{ marginTop: 12 }}>{r}</p>
        </details>
      ))}
    </div>
  );
}
