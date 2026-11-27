import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { duenoActual } from "@/lib/dueno";
import { dominioPractica, intentoDe, pendientesRepaso } from "@/lib/evaluacion/evaluacion";
import { cuota, estadoPlan } from "@/lib/planes";
import { diaMx, formatoHora, inicioDiaMx } from "@/lib/fechas";
import { temaActual } from "@/lib/tema-sesion";
import { sesionActual } from "@/lib/sesion";
import { planDeRuta } from "@/lib/planes-area";

export default async function ResumenPractica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await duenoActual();
  const i = await intentoDe(db, id, d).catch(() => null);
  if (!i || i.modo !== "practica") notFound();
  const [r] = await db
    .select({ total: sql<number>`count(*)::int`, aciertos: sql<number>`count(*) filter (where ${s.respuesta.correcta})::int` })
    .from(s.respuesta)
    .where(and(eq(s.respuesta.intentoId, id)));
  // Cómo te fue en cada materia de esta sesión.
  const porMateria = await db
    .select({
      materia: s.subarea.nombre,
      total: sql<number>`count(*)::int`,
      aciertos: sql<number>`count(*) filter (where ${s.respuesta.correcta})::int`,
    })
    .from(s.respuesta)
    .innerJoin(s.itemIntento, and(eq(s.itemIntento.intentoId, s.respuesta.intentoId), eq(s.itemIntento.orden, s.respuesta.orden)))
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.itemIntento.reactivoId), eq(s.reactivoVersion.version, s.itemIntento.version)))
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .where(eq(s.respuesta.intentoId, id))
    .groupBy(s.subarea.nombre, s.subarea.orden)
    .orderBy(asc(s.subarea.orden));
  const [p] = await db
    .select({ puntos: sql<number>`coalesce(sum(${s.eventoPuntos.puntos}),0)::int` })
    .from(s.eventoPuntos)
    .where(eq(s.eventoPuntos.intentoId, id));
  const tema = await temaActual();
  const c = await cuota(db, i.cuentaId, i.filtro === "repaso" ? "repaso" : "practica");
  const ses = await sesionActual();
  const plan = i.cuentaId ? await estadoPlan(db, i.cuentaId) : null;
  const suyo = planDeRuta(ses?.perfil?.rutaId);
  const sinPreguntas = c.restante === 0;
  const pct = r.total ? r.aciertos / r.total : 0;

  // Meta del día (10 preguntas) y lo que toca mañana.
  const META = 10;
  let meta: { antes: number; hoy: number; racha: number } | null = null;
  let manana: { repaso: number; reforzar: string | null } | null = null;
  if (i.cuentaId && i.filtro !== "repaso") {
    const [{ hoy }] = await db
      .select({ hoy: count() })
      .from(s.respuesta)
      .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
      .where(and(eq(s.intento.cuentaId, i.cuentaId), eq(s.intento.modo, "practica"), gte(s.respuesta.respondidaEn, inicioDiaMx(diaMx()))));
    const [ra] = await db.select({ actual: s.racha.actual }).from(s.racha).where(eq(s.racha.cuentaId, i.cuentaId));
    // Si la sesión es de otro día, no hay meta que festejar hoy.
    const deHoy = i.iniciaEn >= inicioDiaMx(diaMx());
    if (deHoy) meta = { antes: Math.max(0, hoy - r.total), hoy, racha: ra?.actual ?? 0 };
    const [rep, dom] = await Promise.all([pendientesRepaso(db, i.cuentaId, 1), dominioPractica(db, i.cuentaId)]);
    const debil = [...dom.entries()].filter(([, x]) => x.total >= 3).sort((a, b) => a[1].aciertos / a[1].total - b[1].aciertos / b[1].total)[0];
    const nombreDebil = debil
      ? (await db.select({ n: s.subarea.nombre }).from(s.subarea).where(eq(s.subarea.id, debil[0])))[0]?.n ?? null
      : null;
    manana = { repaso: rep.pendientes.length, reforzar: debil && debil[1].aciertos / debil[1].total < 0.7 ? nombreDebil : null };
  }
  const cumplida = meta && meta.antes < META && meta.hoy >= META;
  const titular = pct >= 0.8 ? "Sesión redonda." : pct >= 0.5 ? "Vas bien." : "Hoy aprendiste más de lo que acertaste.";
  return (
    <div className="angosto band pila">
      {meta && <MetaDia antes={meta.antes} hoy={meta.hoy} meta={META} racha={meta.racha} cumplida={!!cumplida} />}
      <span className="pastilla">{tema.practica}: terminada</span>
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>
        {r.aciertos} de {r.total}
      </h1>
      <p className="lead">
        {titular} Ganaste {p.puntos} puntos y lo que fallaste vuelve a tu repaso en 1, 3 y 7 días.
      </p>
      {porMateria.length > 1 && (
        <ul className="resumen-materias" aria-label="Aciertos por materia">
          {porMateria.map((m) => (
            <li key={m.materia}>
              <span>{m.materia}</span>
              <span className="resumen-barra" aria-hidden>
                <span style={{ width: `${(m.aciertos / m.total) * 100}%` }} />
              </span>
              <b>
                {m.aciertos}/{m.total}
              </b>
            </li>
          ))}
        </ul>
      )}
      {c.restante != null && (
        <p className="small">
          {sinPreguntas ? "Ya usaste tus preguntas de hoy" : `Te quedan ${c.restante} preguntas hoy`}
          {c.recargaEn ? `; se recargan a las ${formatoHora(c.recargaEn)} (hora del centro)` : ""}.
        </p>
      )}
      {manana && (manana.repaso > 0 || manana.reforzar) && (
        <div className="manana">
          <span className="app-ojo">Mañana te toca</span>
          <p>
            {manana.repaso > 0 && (
              <>
                <b>
                  {manana.repaso} {manana.repaso === 1 ? "pregunta" : "preguntas"} de repaso
                </b>{" "}
                (las que fallaste vuelven justo a tiempo)
              </>
            )}
            {manana.repaso > 0 && manana.reforzar && " y "}
            {manana.reforzar && (
              <>
                reforzar <b>{manana.reforzar}</b>, tu materia más floja en práctica
              </>
            )}
            .
          </p>
        </div>
      )}
      <div className="fila">
        {sinPreguntas ? (
          plan?.plan !== "pase" && suyo ? (
            <Link href={`/planes#${suyo.sku}`} className="btn">
              Seguir sin límite con el {suyo.nombre}
            </Link>
          ) : null
        ) : (
          <Link href="/practica" className="btn">
            {tema.tomarOtra}
          </Link>
        )}
        <Link href={`/examen/${id}/revision`} className={sinPreguntas && !(plan?.plan !== "pase" && suyo) ? "btn" : "btn sec"}>
          Repasar estas preguntas
        </Link>
        <Link href="/inicio" className="btn disc">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

/** Anillo de la meta diaria. Se llena desde lo que llevabas antes de esta sesión; al cruzar la meta, festeja. */
function MetaDia({ antes, hoy, meta, racha, cumplida }: { antes: number; hoy: number; meta: number; racha: number; cumplida: boolean }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const frac = (n: number) => Math.min(1, n / meta);
  return (
    <div className={`meta-dia ${cumplida ? "cumplida" : hoy >= meta ? "hecha" : ""}`} role="status">
      <svg viewBox="0 0 80 80" className="meta-anillo" aria-hidden style={{ "--desde": C * (1 - frac(antes)), "--hasta": C * (1 - frac(hoy)), "--c": C } as React.CSSProperties}>
        <circle cx="40" cy="40" r={R} className="fondo" />
        <circle cx="40" cy="40" r={R} className="lleno" strokeDasharray={C} />
      </svg>
      {cumplida && (
        <span className="meta-chispas" aria-hidden>
          {Array.from({ length: 10 }, (_, k) => (
            <i key={k} style={{ "--k": k } as React.CSSProperties} />
          ))}
        </span>
      )}
      <div>
        <b className="meta-titulo">{hoy >= meta ? (cumplida ? "¡Meta del día cumplida!" : "Meta del día cumplida") : `${hoy} de ${meta} hoy`}</b>
        <span className="small">
          {hoy >= meta
            ? racha > 0
              ? `Llevas ${racha} ${racha === 1 ? "día" : "días"} seguidos. Vuelve mañana para no romper la racha.`
              : "Vuelve mañana para empezar tu racha."
            : `Te faltan ${meta - hoy} para tu meta de hoy.`}
        </span>
      </div>
    </div>
  );
}
