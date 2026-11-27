import Link from "next/link";
import { FormPractica } from "@/app/practica/form";
import { planPorSku, SKU_BASICO, SKU_MEDICINA } from "@/lib/planes-area";
import type { Metadata } from "next";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { ArrowRight, Award, Check, ClipboardCheck, Lock, RotateCcw, Target, Timer } from "lucide-react";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { cuota, estadoPlan } from "@/lib/planes";
import { puntosSemana, puntosTotales, rachaVigente } from "@/lib/motivacion/motivacion";
import { pendientesRepaso } from "@/lib/evaluacion/evaluacion";
import { ciclo } from "@/lib/consultas";
import { diaMx, diasEntre, formatoFecha, formatoHora, inicioDiaMx } from "@/lib/fechas";
import { Blister } from "@/components/blister";
import { Pulso } from "@/components/pulso";
import { Semaforo } from "@/components/semaforo";
import { CabeceraApp } from "@/components/cabecera-app";
import { plural, temaDeRuta } from "@/lib/tema-area";

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
  const [{ simulacros }] = await db
    .select({ simulacros: count() })
    .from(s.intento)
    .where(and(eq(s.intento.cuentaId, id), eq(s.intento.modo, "simulacro"), eq(s.intento.estado, "enviado")));
  const saludo = ses.cuenta.name || ses.perfil.alias;
  const tema = temaDeRuta(ses.perfil.rutaId);
  const dias = c?.fechaExamen ? Math.max(0, diasEntre(diaMx(), c.fechaExamen)) : null;
  const rachaHoy = rachaVigente(racha);

  // Un solo siguiente paso, en el orden del método: diagnóstico → práctica diaria → repaso → simulacro.
  const paso = enCurso[0]
    ? { icono: <ClipboardCheck size={28} aria-hidden />, ojo: "Lo dejaste a medias", titulo: "Sigue tu diagnóstico", texto: "Tus respuestas están guardadas. Continúa en la sección donde te quedaste.", href: `/examen/${enCurso[0].id}`, boton: "Seguir mi diagnóstico" }
    : !ultimo
      ? { icono: <ClipboardCheck size={28} aria-hidden />, ojo: "Paso 1 de 3", titulo: "Haz tu diagnóstico completo", texto: "Va por secciones y puedes pausar entre ellas. Al final sabes qué dominas y tus 3 prioridades para estudiar.", href: "/diagnostico", boton: "Empezar mi diagnóstico" }
      : hoy < 10
        ? { icono: <Target size={28} aria-hidden />, ojo: "Para hoy", titulo: top[0] ? `Practica ${top[0].nombre}` : "Haz tus 10 preguntas de hoy", texto: top[0] ? "Es tu prioridad número 1. Diez preguntas con el porqué de cada opción." : "Diez preguntas con el porqué de cada opción, empezando por lo que nunca has practicado.", href: top[0] ? `/practica?subarea=${top[0].id}` : "/practica", boton: hoy > 0 ? `Seguir (${hoy} de 10)` : "Empezar mis 10 preguntas" }
        : repaso.pendientes.length > 0
          ? { icono: <RotateCcw size={28} aria-hidden />, ojo: "Ya hiciste tus 10", titulo: `Repasa ${repaso.pendientes.length} ${repaso.pendientes.length === 1 ? "error" : "errores"}`, texto: "Lo que fallaste vuelve justo cuando estás por olvidarlo.", href: "/practica?repaso=1", boton: "Repasar ahora" }
          : { icono: <Timer size={28} aria-hidden />, ojo: "Ya hiciste tus 10", titulo: "Mide tu ritmo con un simulacro", texto: "Todo seguido y con un solo cronómetro, como el día del examen.", href: "/diagnostico", boton: "Ver simulacros" };

  const pasos = [
    { titulo: "Diagnóstico", texto: ultimo ? `Hecho · global ${ultimo.global == null ? "—" : Math.round(Number(ultimo.global))}` : "Sabes dónde estás y qué estudiar primero.", hecho: !!ultimo, actual: !ultimo },
    { titulo: "Práctica diaria", texto: hoy >= 10 ? "Hoy: 10 de 10. ¡Listo!" : `Hoy: ${hoy} de 10 preguntas.`, hecho: hoy >= 10, actual: !!ultimo && hoy < 10 },
    { titulo: "Simulacro", texto: simulacros ? `${simulacros} ${simulacros === 1 ? "hecho" : "hechos"}. Repítelo cada par de semanas.` : "Con tiempo, como el día del examen.", hecho: simulacros > 0, actual: !!ultimo && hoy >= 10 && simulacros === 0 },
  ];

  return (
    <>
      <CabeceraApp
        tema={tema.tema}
        acento={tema.acento}
        ceja={`${tema.espacio} ${saludo}`}
        titulo={
          <>
            Hola, <em>{saludo}</em>.
          </>
        }
        sub={
          dias != null ? (
            <>
              Faltan <b>{dias} {dias === 1 ? "día" : "días"}</b> para tu examen ({formatoFecha(c!.fechaExamen!, { day: "numeric", month: "long" })}). {tema.area}.
            </>
          ) : (
            <>
              {tema.area}. La fecha del examen aparece aquí en cuanto salga la convocatoria.
            </>
          )
        }
        acciones={<PlanEtiqueta plan={plan.plan} hasta={plan.plan === "prueba" ? plan.pruebaHasta : plan.paseHasta} productos={plan.productos} />}
        cifras={[
          { valor: <>{Math.min(hoy, 10)}<small>/10</small></>, etiqueta: "Preguntas hoy" },
          { valor: rachaHoy, etiqueta: plural(rachaHoy, tema.racha), nota: `Mejor: ${racha?.mejor ?? 0}` },
          { valor: semana.toLocaleString("es-MX"), etiqueta: "Puntos esta semana", nota: <Link href="/liga">Ver mi liga</Link> },
          { valor: total.toLocaleString("es-MX"), etiqueta: "Puntos totales" },
        ]}
      />
      <div className="wrap app-cuerpo" style={{ "--acento": tema.acento } as React.CSSProperties}>
        {bienvenida && (
          <p className="aviso ok">
            Listo, {saludo}. Tienes el pase completo hasta el {plan.pruebaHasta ? formatoFecha(plan.pruebaHasta, { day: "numeric", month: "long" }) : "—"}.
            Al terminar bajas solo al plan gratis, sin cobro.
          </p>
        )}

        <section className="siguiente-paso" aria-labelledby="paso">
          <span className="icono-paso">{paso.icono}</span>
          <div>
            <span className="app-ojo">{paso.ojo}</span>
            <h2 id="paso">{paso.titulo}</h2>
            <p>{paso.texto}</p>
          </div>
          <Link href={paso.href} className="btn">
            {paso.boton} <ArrowRight size={18} aria-hidden />
          </Link>
        </section>

        <section className="tarjeta" aria-labelledby="metodo">
          <div className="tarjeta-cabeza">
            <h2 id="metodo">Tu método</h2>
          </div>
          <ol className="ruta-pasos">
            {pasos.map((x, i) => (
              <li key={x.titulo} className={x.hecho ? "hecho" : x.actual ? "actual" : ""}>
                <span className="num">{x.hecho ? <Check size={14} aria-hidden /> : i + 1}</span>
                <b>{x.titulo}</b>
                <span className="small">{x.texto}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="app-rejilla">
          <section className="tarjeta c-7" aria-labelledby="hoy">
            <div className="tarjeta-cabeza">
              <span className="icono-chip">
                <Target size={20} aria-hidden />
              </span>
              <h2 id="hoy">Tu {tema.practicaHoy}</h2>
              <span className="dato-meta">{Math.min(hoy, 10)} de 10</span>
            </div>
            <Blister tomadas={hoy} tema={tema.tema} pieza={tema.pieza} />
            {cuotaPractica.restante != null && (
              <p className="small">
                Plan gratis: te quedan {cuotaPractica.restante} de {cuotaPractica.cantidad} preguntas hoy.
                {cuotaPractica.recargaEn ? ` Se recargan a las ${formatoHora(cuotaPractica.recargaEn).replace(/\.$/, "")}.` : ""}
              </p>
            )}
            <div className="pie-tarjeta">
              <FormPractica
                etiqueta={hoy >= 10 ? tema.tomarOtra : tema.tomar}
                deshabilitado={!cuotaPractica.permitido}
                muro={cuotaPractica.permitido ? null : cuotaPractica.textoMuro}
              />
              <Link href="/practica#temas" className="btn sec chico">
                Elegir tema
              </Link>
              {repaso.pendientes.length > 0 && (
                <Link href="/practica?repaso=1" className="btn disc">
                  <RotateCcw size={16} aria-hidden /> Repaso: {repaso.pendientes.length} {plan.plan === "gratis" && <Lock size={14} aria-hidden />}
                </Link>
              )}
            </div>
          </section>
          <section className="c-5" aria-label="Racha de estudio">
            <Pulso dias={racha?.dias ? racha.dias.split(",") : []} racha={rachaHoy} mejor={racha?.mejor ?? 0} tema={tema.tema} textos={tema.racha} />
          </section>

          <section className="tarjeta c-7" aria-labelledby="prioridades">
            <div className="tarjeta-cabeza">
              <span className="icono-chip">
                <ClipboardCheck size={20} aria-hidden />
              </span>
              <h2 id="prioridades">Tus prioridades</h2>
              {ultimo && (
                <span className="dato-meta">
                  Global <b className="cifra">{ultimo.global == null ? "—" : Math.round(Number(ultimo.global))}</b> <Semaforo nivel={ultimo.nivel} />
                </span>
              )}
            </div>
            {ultimo && top.length > 0 ? (
              <ol className="lista-prioridades">
                {top.map((p) => (
                  <li key={p.id}>
                    <span>{p.nombre}</span>
                    <Link href={`/practica?subarea=${p.id}`} className="btn sec chico">
                      Practicar
                    </Link>
                  </li>
                ))}
              </ol>
            ) : ultimo ? (
              <p>Ninguna subárea quedó por debajo de «Dominas». Mantén el ritmo con tu práctica diaria.</p>
            ) : (
              <div className="vacio">
                <h3>Aún no sabemos qué estudiar primero</h3>
                <p>{tema.diagnosticoTexto} Aquí aparecerán tus 3 prioridades.</p>
              </div>
            )}
            <div className="pie-tarjeta">
              {ultimo && (
                <Link href={`/examen/${ultimo.id}/resultado`} className="btn disc">
                  Ver resultados completos
                </Link>
              )}
              <Link href="/diagnostico" className="btn disc">
                {ultimo ? "Nuevo diagnóstico o simulacro" : "Ver el diagnóstico"}
              </Link>
            </div>
          </section>
          <section className="tarjeta c-5" aria-labelledby="insignias">
            <div className="tarjeta-cabeza">
              <span className="icono-chip">
                <Award size={20} aria-hidden />
              </span>
              <h2 id="insignias">Insignias</h2>
              <span className="dato-meta">{insignias.length} ganadas</span>
            </div>
            {insignias.length ? (
              <div className="fila">
                {insignias.map((i) => (
                  <span key={i.nombre} className="pastilla" title={i.descripcion}>
                    {i.nombre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="small">Se ganan por aprender: tu primera sección, una subárea que sube de nivel o un error que dejas de cometer.</p>
            )}
            <div className="pie-tarjeta">
              <Link href="/liga" className="btn disc">
                Ver todas en la liga
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function PlanEtiqueta({ plan, hasta, productos }: { plan: string; hasta: Date | null; productos: string[] }) {
  const nombre = productos.includes(SKU_MEDICINA)
    ? "Paquete Medicina"
    : (productos.map((s) => planPorSku(s)?.nombre).find(Boolean) ?? (productos.includes(SKU_BASICO) ? "Pase Básico" : "Pase completo"));
  if (plan === "gratis")
    return (
      <Link href="/planes" className="pastilla enlace">
        Plan gratis · ver el plan de tu área
      </Link>
    );
  return (
    <span className="pastilla">
      {plan === "prueba" ? "Prueba de 3 días" : nombre}
      {hasta ? ` hasta el ${formatoFecha(hasta, { day: "numeric", month: "short" })}` : ""}
    </span>
  );
}
