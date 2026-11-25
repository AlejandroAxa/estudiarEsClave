import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { duenoActual } from "@/lib/dueno";
import { intentoDe } from "@/lib/evaluacion/evaluacion";
import { cuota } from "@/lib/planes";
import { formatoHora } from "@/lib/fechas";
import { temaActual } from "@/lib/tema-sesion";

export default async function ResumenPractica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await duenoActual();
  const i = await intentoDe(db, id, d).catch(() => null);
  if (!i || i.modo !== "practica") notFound();
  const [r] = await db
    .select({ total: sql<number>`count(*)::int`, aciertos: sql<number>`count(*) filter (where ${s.respuesta.correcta})::int` })
    .from(s.respuesta)
    .where(and(eq(s.respuesta.intentoId, id)));
  const [p] = await db
    .select({ puntos: sql<number>`coalesce(sum(${s.eventoPuntos.puntos}),0)::int` })
    .from(s.eventoPuntos)
    .where(eq(s.eventoPuntos.intentoId, id));
  const tema = await temaActual();
  const c = await cuota(db, i.cuentaId, i.filtro === "repaso" ? "repaso" : "practica");
  return (
    <div className="angosto band pila">
      <span className="pastilla">{tema.practica}: terminada</span>
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>
        {r.aciertos} de {r.total}
      </h1>
      <p className="lead">Ganaste {p.puntos} puntos. Lo que fallaste vuelve a tu repaso en 1, 3 y 7 días.</p>
      {c.restante != null && (
        <p className="small">
          Te quedan {c.restante} preguntas hoy{c.recargaEn ? `; se recargan a las ${formatoHora(c.recargaEn)} (hora del centro)` : ""}.
        </p>
      )}
      <div className="fila">
        <Link href="/practica" className="btn">
          {tema.tomarOtra}
        </Link>
        <Link href={`/examen/${id}/revision`} className="btn sec">
          Repasar estas preguntas
        </Link>
        <Link href="/inicio" className="btn disc">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
