import Link from "next/link";
import type { Metadata } from "next";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { Award, Lock } from "lucide-react";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { cuota, estadoPlan } from "@/lib/planes";
import { puntosSemana, puntosTotales, rachaVigente } from "@/lib/motivacion/motivacion";
import { pendientesRepaso } from "@/lib/evaluacion/evaluacion";
import { ciclo } from "@/lib/consultas";
import { diaMx, formatoFecha, formatoHora, inicioDiaMx } from "@/lib/fechas";
import { Blister } from "@/components/blister";
import { Pulso } from "@/components/pulso";
import { CuentaRegresiva } from "@/components/cuenta-regresiva";
import { Semaforo } from "@/components/semaforo";

export const metadata: Metadata = { title: "Inicio" };

export default async function Inicio({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const ses = await requerirAlumno();
  const { bienvenida } = await searchParams;
  const id = ses.cuenta.id;
  const [plan, cuotaPractica, racha, total, semana, c, repaso] = await Promise.all([
    estadoPlan(db, id),
    cuota(db, id, "practica"),
    db.select().from(s.racha).where(eq(s.racha.cuentaId, id)).then((r) => r[0]),
    puntosTotales(db, id),
    puntosSemana(db, id),
    ciclo(ses.perfil.examenId, ses.perfil.cicloAnio),
    pendientesRepaso(db, id),
  ]);
  const [{ hoy }] = await db
    .select({ hoy: count() })
    .from(s.respuesta)
    .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
    .where(and(eq(s.intento.cuentaId, id), eq(s.intento.modo, "practica"), gte(s.respuesta.respondidaEn, inicioDiaMx(diaMx()))));
  const enCurso = await db
    .select()
    .from(s.intento)
    .where(and(eq(s.intento.cuentaId, id), eq(s.intento.estado, "en_curso"), eq(s.intento.modo, "diagnostico")))
    .orderBy(desc(s.intento.iniciaEn))
    .limit(1);
  const [ultimo] = await db
    .select({ id: s.intento.id, enviado: s.intento.enviadoEn, global: s.resultado.global, nivel: s.resultado.nivel })
    .from(s.intento)
    .innerJoin(s.resultado, eq(s.resultado.intentoId, s.intento.id))
    .where(and(eq(s.intento.cuentaId, id), eq(s.intento.modo, "diagnostico")))
    .orderBy(desc(s.intento.enviadoEn))
    .limit(1);
  const prioridades = ultimo
    ? await db
        .select({ id: s.resultadoSubarea.subareaId, nombre: s.subarea.nombre, nivel: s.resultadoSubarea.nivel, lugar: s.resultadoSubarea.lugarPrioridad })
        .from(s.resultadoSubarea)
        .innerJoin(s.subarea, eq(s.subarea.id, s.resultadoSubarea.subareaId))
        .where(and(eq(s.resultadoSubarea.intentoId, ultimo.id)))
    : [];
  const top = prioridades.filter((p) => p.lugar).sort((a, b) => a.lugar! - b.lugar!);
  const insignias = await db
    .select({ nombre: s.insignia.nombre, descripcion: s.insignia.descripcion })
    .from(s.cuentaInsignia)
    .innerJoin(s.insignia, eq(s.insignia.id, s.cuentaInsignia.insigniaId))
    .where(eq(s.cuentaInsignia.cuentaId, id));
  const saludo = ses.cuenta.name || ses.perfil.alias;

  return (
    <div className="wrap band pila">
      {bienvenida && (
        <p className="aviso ok">
          Listo, {saludo}. Tienes el pase completo hasta el {plan.pruebaHasta ? formatoFecha(plan.pruebaHasta, { day: "numeric", month: "long" }) : "—"}. Al
          terminar bajas solo al plan gratis, sin cobro.
        </p>
      )}
      <div className="fila entre">
        <div>
          <span className="small">Consultorio de</span>
          <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>{saludo}</h1>
        </div>
        <PlanEtiqueta plan={plan.plan} hasta={plan.plan === "prueba" ? plan.pruebaHasta : plan.paseHasta} areas={plan.areas} />
      </div>

      <div className="rejilla-2">
        <section className="hoja pila" aria-labelledby="dosis">
          <div className="fila entre">
            <h2 id="dosis" style={{ fontSize: 26, margin: 0 }}>
              Tu dosis de hoy
            </h2>
            <span className="small">
              {Math.min(hoy, 10)}/10
            </span>
          </div>
          <Blister tomadas={hoy} />
          {cuotaPractica.restante != null && (
            <p className="small" style={{ margin: 0 }}>
              Te quedan {cuotaPractica.restante} de {cuotaPractica.cantidad} preguntas gratis hoy.
              {cuotaPractica.recargaEn ? ` Se recargan a las ${formatoHora(cuotaPractica.recargaEn)}.` : ""}
            </p>
          )}
          <div className="fila">
            <Link href="/practica" className="btn">
              {hoy >= 10 ? "Tomar otra dosis" : "Tomar mi dosis"}
            </Link>
            {repaso.pendientes.length > 0 && (
              <Link href="/practica?repaso=1" className="btn sec">
                Repaso: {repaso.pendientes.length} {plan.plan === "gratis" && <Lock size={14} aria-hidden />}
              </Link>
            )}
          </div>
        </section>
        <section className="pila">
          <Pulso dias={racha?.dias ? racha.dias.split(",") : []} racha={rachaVigente(racha)} mejor={racha?.mejor ?? 0} />
          <div className="rejilla">
            <div className="tarjeta-dato">
              <span className="small">Puntos totales</span>
              <span className="cifra">{total.toLocaleString("es-MX")}</span>
            </div>
            <div className="tarjeta-dato">
              <span className="small">Esta semana</span>
              <span className="cifra">{semana.toLocaleString("es-MX")}</span>
              <Link href="/liga" className="xs">
                Ver mi liga
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="rejilla-2">
        <section className="hoja pila" aria-labelledby="diag">
          <h2 id="diag" style={{ fontSize: 26 }}>
            Laboratorio
          </h2>
          {enCurso[0] ? (
            <>
              <p>Tienes un diagnóstico a medias. Sigue donde lo dejaste.</p>
              <Link href={`/examen/${enCurso[0].id}`} className="btn">
                Seguir mi diagnóstico
              </Link>
            </>
          ) : ultimo ? (
            <>
              <p>
                Último diagnóstico: <b className="cifra">{ultimo.global == null ? "—" : Math.round(Number(ultimo.global))}</b> <Semaforo nivel={ultimo.nivel} />
              </p>
              {top.length > 0 && (
                <ol className="small">
                  {top.map((p) => (
                    <li key={p.id}>
                      <Link href={`/practica?subarea=${p.id}`}>{p.nombre}</Link>
                    </li>
                  ))}
                </ol>
              )}
              <div className="fila">
                <Link href={`/examen/${ultimo.id}/resultado`} className="btn sec chico">
                  Ver resultados
                </Link>
                <Link href="/diagnostico" className="btn disc">
                  Nuevo diagnóstico o simulacro
                </Link>
              </div>
            </>
          ) : (
            <>
              <p>Tu primer diagnóstico completo te dice qué estudiar primero. Va por secciones y puedes pausar entre ellas.</p>
              <Link href="/diagnostico" className="btn">
                Hacer mi diagnóstico
              </Link>
            </>
          )}
        </section>
        <section className="hoja pila">
          <CuentaRegresiva fecha={c?.fechaExamen ?? null} examen={ses.perfil.examenId} />
          <div>
            <h3>
              <Award size={18} aria-hidden /> Insignias
            </h3>
            {insignias.length ? (
              <div className="fila">
                {insignias.map((i) => (
                  <span key={i.nombre} className="pastilla" title={i.descripcion}>
                    {i.nombre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="small">Ganas insignias por aprender: tu primera sección, una subárea que sube de nivel o un error que dejas de cometer.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PlanEtiqueta({ plan, hasta, areas }: { plan: string; hasta: Date | null; areas: string[] | null }) {
  if (plan === "gratis")
    return (
      <Link href="/planes" className="pastilla">
        Plan gratis · ver el pase
      </Link>
    );
  return (
    <span className="pastilla">
      {plan === "prueba" ? "Prueba del pase" : areas ? "Pase Básico" : "Pase completo"}
      {hasta ? ` hasta el ${formatoFecha(hasta, { day: "numeric", month: "short" })}` : ""}
    </span>
  );
}
