import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos de uso" };

/** Borrador. Completar los datos entre corchetes y revisar con un abogado antes de lanzar. */
export default function Terminos() {
  return (
    <div className="wrap band pila angosto lectura">
      <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>Términos de uso</h1>
      <p className="small">Versión 2026-11.</p>
      <h2>El servicio</h2>
      <p>
        Estudiar es Clave es un simulador para preparar exámenes de admisión. Las preguntas son originales; no tenemos relación con el CENEVAL ni
        con ninguna universidad, y nuestras calificaciones son estimaciones que no garantizan tu resultado oficial.
      </p>
      <h2>Tu cuenta</h2>
      <p>Tu cuenta es personal. No compartas tu acceso ni publiques las preguntas del banco. Tu alias no puede ser ofensivo ni hacerse pasar por otra persona.</p>
      <h2>Pagos</h2>
      <p>
        Los pases se pagan una sola vez, incluyen IVA y duran hasta el día del examen del ciclo que compraste. No hay renovación automática. Solo se
        aplica un descuento por compra: el mejor entre la promoción vigente, un cupón o un código de referido. Los cobros los procesa Mercado Pago.
      </p>
      <h2>Reembolsos</h2>
      <p>[Política de reembolso por definir por el responsable.] Si se reembolsa una compra, el acceso termina ese día y tus resultados se conservan.</p>
      <h2>Contenido</h2>
      <p>Las preguntas, explicaciones y textos del sitio son propiedad de [responsable]. Si encuentras un error, repórtalo desde la pregunta.</p>
      <h2>Contacto</h2>
      <p>[correo de contacto]</p>
    </div>
  );
}
