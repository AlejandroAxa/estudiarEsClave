import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "EXANI-I para entrar a la prepa" };

export default function Prepa() {
  return (
    <div className="wrap band pila angosto lectura">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>¿Vas a entrar a la prepa?</h1>
      <p className="lead">
        El EXANI-I es el examen para entrar al bachillerato. Estamos preparando su banco de preguntas con la misma regla que usamos para el EXANI-II:
        preguntas originales, revisadas por un docente, y un diagnóstico que te dice qué estudiar primero.
      </p>
      <p>
        Puedes crear tu cuenta desde ahora y elegir la ruta de prepa. Te avisamos por correo cuando el diagnóstico esté listo.
      </p>
      <div className="fila">
        <Link className="btn" href="/entrar">
          Crear mi cuenta
        </Link>
        <Link className="btn sec" href="/guia">
          Ver cómo es el EXANI-II
        </Link>
      </div>
    </div>
  );
}
