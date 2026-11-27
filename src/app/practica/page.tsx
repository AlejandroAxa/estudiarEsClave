import type { Metadata } from "next";
import { db } from "@/db";
import { requerirAlumno } from "@/lib/sesion";
import { cuota, estadoPlan, incluido, planParaArea } from "@/lib/planes";
import { dominioPractica, pendientesRepaso, poolPractica, taxonomiaDe } from "@/lib/evaluacion/evaluacion";
import { aciertosPorMateria, MEDALLA_CADA } from "@/lib/motivacion/motivacion";
import { Medalla } from "@/components/medalla";
import { formatoHora } from "@/lib/fechas";
import { temaDeRuta } from "@/lib/tema-area";
import { FormPractica } from "./form";
import Link from "next/link";
import { Lock } from "lucide-react";
import { CabeceraApp } from "@/components/cabecera-app";
import { AvisoPlanArea } from "@/components/aviso-plan-area";
import { eq } from "drizzle-orm";
import * as s from "@/db/schema";

export const metadata: Metadata = { title: "Práctica diaria" };

export default async function Practica({ searchParams }: { searchParams: Promise<{ subarea?: string; repaso?: string }> }) {
  const ses = await requerirAlumno("/practica");
  const { subarea, repaso } = await searchParams;
  const tema = temaDeRuta(ses.perfil.rutaId);
  const plan = await estadoPlan(db, ses.cuenta.id);
  const c = await cuota(db, ses.cuenta.id, "practica", plan.plan);
  const rep = await pendientesRepaso(db, ses.cuenta.id);
  const repasoIncluido = await incluido(db, plan.plan, "repaso");
  const { items } = await poolPractica(db, ses.cuenta.id, ses.perfil.rutaId, {});
  const areaIds = (await db.select({ id: s.area.id }).from(s.area).where(eq(s.area.examenId, ses.perfil.examenId))).map((a) => a.id);
  const tax = await taxonomiaDe(db, areaIds);
  const dominio = await dominioPractica(db, ses.cuenta.id);
  const aciertos = await aciertosPorMateria(db, ses.cuenta.id);
  const disponibles = new Map<string, number>();
  for (const i of items) disponibles.set(i.subareaId, (disponibles.get(i.subareaId) ?? 0) + 1);

  const conPreguntas = tax
    .map((a) => ({ ...a, total: a.subareas.reduce((n, x) => n + (disponibles.get(x.id) ?? 0), 0) }))
    .filter((a) => a.total > 0)
    // Lo que no cuenta para el puntaje (Inglés) va al final.
    .sort((a, b) => Number(b.cuentaPuntaje) - Number(a.cuentaPuntaje));
  const sinPreguntas = tax.length - conPreguntas.length;

  return (
    <>
      <CabeceraApp
        tema={tema.tema}
        acento={tema.acento}
        ceja={tema.area}
        titulo={tema.practicaTitulo}
        sub="Diez preguntas a la vez. Al responder ves la correcta, el procedimiento y por qué cada opción es o no es."
        cifras={[
          { valor: items.length.toLocaleString("es-MX"), etiqueta: "Preguntas disponibles" },
          { valor: rep.pendientes.length, etiqueta: "Errores por repasar hoy", nota: rep.enEspera ? `${rep.enEspera} en espera` : undefined },
          {
            valor: c.restante != null ? <>{c.restante}<small>/{c.cantidad}</small></> : "Sin límite",
            etiqueta: c.restante != null ? "Te quedan hoy" : "Tu plan",
            nota: c.recargaEn ? `Se recargan a las ${formatoHora(c.recargaEn)}` : undefined,
          },
        ]}
      />
      <div className="wrap app-cuerpo">
        <AvisoPlanArea plan={plan} rutaId={ses.perfil.rutaId} />
        {items.length === 0 && (
          <p className="aviso">
            Para cuidar tu diagnóstico, las preguntas del banco se abren a la práctica cuando las ves en tu revisión. Presenta tu diagnóstico completo y
            aquí aparecerán.
          </p>
        )}
        <section className="prac-hoy" aria-label="Para hoy">
          <article className="prac-paso principal" aria-labelledby="mezcla" style={{ "--acento": tema.acento } as React.CSSProperties}>
            <span className="prac-bruma" aria-hidden />
            <div className="prac-paso-cabeza">
              <span className="prac-num">01</span>
              <span className="prac-ojo">Recomendado para hoy</span>
            </div>
            <h2 id="mezcla">{tema.bloqueGeneral}</h2>
            <p>Diez preguntas de todo tu examen. Empezamos por lo que nunca has visto y por tus prioridades, y al responder ves el porqué de cada opción.</p>
            <ul className="prac-datos">
              <li>
                <b>10</b> preguntas
              </li>
              <li>
                <b>~12</b> minutos
              </li>
              <li>
                <b>{items.length.toLocaleString("es-MX")}</b> en tu banco
              </li>
            </ul>
            <FormPractica etiqueta={tema.tomar} deshabilitado={!c.permitido || !items.length} muro={c.permitido ? null : c.textoMuro} />
          </article>
          <article className="prac-paso" aria-labelledby="repaso">
            <div className="prac-paso-cabeza">
              <span className="prac-num">02</span>
              <span className="prac-ojo">Para que no se te olvide</span>
            </div>
            <h2 id="repaso">Repaso espaciado</h2>
            <p className="prac-cifra">
              <b>{rep.pendientes.length}</b>
              <span>{rep.pendientes.length === 1 ? "pregunta lista hoy" : "preguntas listas hoy"}</span>
            </p>
            <p>
              Lo que fallaste vuelve a los 1, 3 y 7 días.
              {rep.enEspera ? ` ${rep.enEspera} más esperan su turno.` : ""}
            </p>
            <FormPractica
              etiqueta="Repasar ahora"
              repaso
              chico
              deshabilitado={!repasoIncluido || rep.pendientes.length === 0 || !ses.perfil.repasoEspaciado}
              muro={!repasoIncluido ? "El repaso espaciado viene con el pase." : !ses.perfil.repasoEspaciado ? "Lo apagaste en tu cuenta." : null}
              autoIniciar={repaso === "1"}
            />
          </article>
        </section>

        <section className="prac-materias" aria-labelledby="temas">
          <div className="prac-materias-cabeza">
            <div>
              <span className="prac-ojo">O elige una materia</span>
              <h2 id="temas">Practica por materia</h2>
            </div>
            <p>
              La barra es tu dominio: aciertos en tus últimas 20 respuestas de esa materia. Verde ya está firme; rojo es donde más ganas. Cada {MEDALLA_CADA}{" "}
              aciertos en una materia te dan una medalla.
            </p>
          </div>
          <div>
            {conPreguntas.map((a, k) => {
              // Con un pase que no abre esta área se practica con la cuota de prueba o gratis.
              const abierta = planParaArea(plan, a.id) === plan.plan;
              return (
                <div key={a.id} className="prac-area">
                  <div className="prac-area-titulo">
                    <span className="prac-num">{String(k + 1).padStart(2, "0")}</span>
                    <h3>{a.nombre}</h3>
                    {!a.cuentaPuntaje && <span className="prac-etiqueta">No cuenta para tu puntaje</span>}
                    {!abierta && (
                      <span className="prac-etiqueta">
                        <Lock size={12} aria-hidden /> Fuera de tu plan: cuenta en tu límite diario
                      </span>
                    )}
                  </div>
                  <ul className="prac-filas">
                    {a.subareas
                      .filter((x) => (disponibles.get(x.id) ?? 0) > 0)
                      .map((x) => (
                        <li key={x.id}>
                          <b>
                            {x.nombre}
                            <MedallasMateria aciertos={aciertos.get(x.id) ?? 0} />
                          </b>
                          <DominioMini d={dominio.get(x.id)} />
                          <span className="prac-cuantas">{disponibles.get(x.id)} preguntas</span>
                          <FormPractica etiqueta="Practicar" subarea={x.id} enlace deshabilitado={abierta && !c.permitido} autoIniciar={subarea === x.id} />
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
            {conPreguntas.length === 0 && <p className="small">Todavía no hay temas abiertos para practicar.</p>}
            {sinPreguntas > 0 && conPreguntas.length > 0 && (
              <p className="xs" style={{ marginTop: 18 }}>
                Las demás materias del banco no son de tu área. Si cambiaste de carrera, actualízala en <Link href="/diagnostico">Diagnóstico</Link>.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/** Barra de dominio de práctica (aciertos en las últimas 20). Con menos de 3 respuestas todavía no dice nada. */
function DominioMini({ d }: { d?: { aciertos: number; total: number } }) {
  if (!d || d.total < 3) return <span className="dominio-mini sin-datos">Sin empezar</span>;
  const pct = Math.round((d.aciertos / d.total) * 100);
  const nivel = pct >= 70 ? "ok" : pct >= 45 ? "mid" : "bad";
  return (
    <span className={`dominio-mini ${nivel}`} title={`${d.aciertos} de tus últimas ${d.total} bien`}>
      <span className="dominio-barra" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="dominio-pct">{pct} %</span>
      <span className="sr-only">
        de dominio: {d.aciertos} de tus últimas {d.total} respuestas fueron correctas
      </span>
    </span>
  );
}

/** Medalla que lleva el alumno en la materia, con lo que le falta para la siguiente. */
function MedallasMateria({ aciertos }: { aciertos: number }) {
  if (!aciertos) return null;
  const n = Math.floor(aciertos / MEDALLA_CADA);
  const faltan = MEDALLA_CADA - (aciertos % MEDALLA_CADA);
  return (
    <span className="medallas-fila" title={`${aciertos} aciertos · faltan ${faltan} para la siguiente medalla`}>
      {n > 0 && <Medalla numero={n} tamano={22} />}
      <span>
        {n > 0 ? `×${n} · ` : ""}
        {faltan} para {n ? "la siguiente" : "tu medalla"}
      </span>
    </span>
  );
}
