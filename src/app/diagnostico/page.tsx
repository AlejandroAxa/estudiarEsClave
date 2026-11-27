import Link from "next/link";
import type { Metadata } from "next";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { cuota, estadoPlan, planParaRuta } from "@/lib/planes";
import { plantillaActiva } from "@/lib/evaluacion/evaluacion";
import { formatoFecha } from "@/lib/fechas";
import { BotonEmpezar } from "./boton";
import { ClipboardCheck, Hourglass, Timer } from "lucide-react";
import { CabeceraApp, TituloBloque } from "@/components/cabecera-app";
import { rutasElegibles } from "@/lib/consultas";
import { OPCIONES_MINI, areaGeneralPorRuta } from "@/lib/areas-generales";
import { cambiarRuta } from "@/app/acciones/perfil";
import { temaDeRuta } from "@/lib/tema-area";
import { AvisoPlanArea } from "@/components/aviso-plan-area";
import { opcionesSelector, puedeCambiarA, reglaCambio } from "@/lib/cambio-area";
import { planDeRuta } from "@/lib/planes-area";

export const metadata: Metadata = { title: "Diagnóstico y simulacros" };

export default async function Diagnostico({ searchParams }: { searchParams: Promise<{ area?: string; cambio?: string }> }) {
  const { area, cambio } = await searchParams;
  const ses = await requerirAlumno(area ? `/diagnostico?area=${encodeURIComponent(area)}` : "/diagnostico");
  const ruta = ses.perfil.rutaId;
  const rutas = (await rutasElegibles()).filter((r) => r.examenId === ses.perfil.examenId);
  const actual = rutas.find((r) => r.id === ruta);
  const pedida = area ? OPCIONES_MINI.find((o) => o.slug === area) : undefined;
  const regla = await reglaCambio(db, ses.cuenta.id, rutas);
  const opciones = opcionesSelector(rutas, regla, ruta);
  const pedidaPermitida = pedida && pedida.id !== ruta && rutas.some((r) => r.id === pedida.id);
  const sugerida = pedidaPermitida && puedeCambiarA(regla, pedida.id, ruta) ? pedida : undefined;
  // Pidió un área que su plan o la espera no le dejan: se lo explicamos en vez de ignorarlo.
  const negada = pedidaPermitida && !sugerida ? pedida : undefined;
  const general = areaGeneralPorRuta(ruta);
  const modos = [
    { modo: "diagnostico", titulo: "Diagnóstico completo", cuando: "Empieza aquí", texto: "Por secciones, una por área, con pausa entre ellas. Te da tu nivel por subárea y tus 3 prioridades.", icono: <ClipboardCheck size={20} aria-hidden /> },
    { modo: "simulacro", titulo: "Simulacro cronometrado", cuando: "Cada 2 o 3 semanas", texto: "Todo seguido y con un solo cronómetro, como el día del examen. Mide tu ritmo y tu resistencia.", icono: <Timer size={20} aria-hidden /> },
    { modo: "muestra", titulo: "Simulacro de muestra", cuando: "Si tienes 20 minutos", texto: "Una probadita del examen real para sentir el ritmo sin apartar toda la tarde.", icono: <Hourglass size={20} aria-hidden /> },
  ] as const;
  const plan = await estadoPlan(db, ses.cuenta.id);
  const tarjetas = await Promise.all(
    modos.map(async (m) => {
      const pl = await plantillaActiva(db, ruta, m.modo);
      const c = await cuota(db, ses.cuenta.id, m.modo, planParaRuta(plan, ruta));
      return { ...m, pl, c };
    }),
  );
  const historial = await db
    .select({ i: s.intento, global: s.resultado.global })
    .from(s.intento)
    .leftJoin(s.resultado, eq(s.resultado.intentoId, s.intento.id))
    .where(and(eq(s.intento.cuentaId, ses.cuenta.id), inArray(s.intento.modo, ["diagnostico", "simulacro", "muestra", "mini"])))
    .orderBy(desc(s.intento.iniciaEn))
    .limit(20);
  const hechos = historial.filter(({ i }) => i.modo === "diagnostico" && i.estado === "enviado").length;
  const enCurso = historial.find(({ i }) => i.estado === "en_curso");
  const tema = temaDeRuta(ruta);
  return (
    <>
      <CabeceraApp
        tema={tema.tema}
        acento={tema.acento}
        ceja={actual?.nombre ?? tema.area}
        titulo="Diagnóstico y simulacros"
        sub="Durante el examen no verás qué acertaste: todo se califica al final. Las preguntas que no respondas cuentan como no acertadas, igual que en el examen real."
        acciones={
          enCurso ? (
            <Link href={`/examen/${enCurso.i.id}`} className="btn">
              Seguir el que dejaste a medias
            </Link>
          ) : undefined
        }
      />
      <div className="wrap app-cuerpo">
        <AvisoPlanArea plan={plan} rutaId={ruta} />
        {sugerida && (
          <form action={cambiarRuta} className="aviso pila" style={{ maxWidth: 720 }}>
            <input type="hidden" name="ruta" value={sugerida.id} />
            <p style={{ margin: 0 }}>
              Tu cuenta está en <b>{actual?.nombre ?? ruta}</b>. ¿Quieres que tu diagnóstico, tus simulacros y tu práctica salgan del banco de{" "}
              <b>{sugerida.nombre}</b>?
            </p>
            <div>
              <button className="btn chico">Cambiar a {sugerida.nombre}</button>
            </div>
          </form>
        )}
        {(cambio === "no" || negada) && (
          <p className="aviso" role="status">
            {regla.motivo === "plan" ? (
              <>
                Tu plan abre las preguntas de {actual?.nombre ?? ruta}
                {negada ? `, no las de ${negada.nombre}` : ""}. Para estudiar otra área necesitas su plan:{" "}
                <Link href={`/planes${negada && planDeRuta(negada.id) ? `#${planDeRuta(negada.id)!.sku}` : ""}`}>ver los planes</Link>.
              </>
            ) : regla.bloqueadoHasta ? (
              <>Ya cambiaste de área hace poco. Podrás volver a cambiarla a partir del {formatoFecha(regla.bloqueadoHasta, { day: "numeric", month: "long" })}.</>
            ) : (
              <>No se pudo cambiar a esa área.</>
            )}
          </p>
        )}
        {cambio === "1" && !sugerida && (
          <p className="aviso ok" role="status">
            Listo: tus exámenes ya salen del banco de {actual?.nombre ?? ruta}.
          </p>
        )}
        <div className="app-rejilla">
          {tarjetas.map((t, k) => {
            const recomendada = (t.modo === "diagnostico" && hechos === 0) || (t.modo === "simulacro" && hechos > 0);
            return (
              <section key={t.modo} className={`tarjeta c-4 ${recomendada ? "destacada" : ""}`} aria-labelledby={`m-${t.modo}`}>
                <div className="tarjeta-cabeza">
                  <span className="icono-chip">{t.icono}</span>
                  <span className="app-ojo" style={{ margin: 0 }}>
                    {k + 1} · {t.cuando}
                  </span>
                  {recomendada && <span className="insignia-recomendada" style={{ marginLeft: "auto" }}>Para ti</span>}
                </div>
                <h2 id={`m-${t.modo}`} style={{ fontSize: 24 }}>
                  {t.titulo}
                </h2>
                <p className="small">{t.texto}</p>
                <dl className="ficha-modo">
                  <div>
                    <dt>Duración</dt>
                    <dd>{t.pl ? `${t.pl.tiempoLimiteMin} min` : "—"}</dd>
                  </div>
                  {t.c.cantidad != null && t.c.cantidad > 0 && (
                    <div>
                      <dt>Te quedan</dt>
                      <dd>
                        {t.c.restante} de {t.c.cantidad}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="pie-tarjeta">
                  {t.pl ? <BotonEmpezar modo={t.modo} permitido={t.c.permitido} muro={t.c.textoMuro} /> : <p className="xs">Aún no disponible para tu carrera.</p>}
                </div>
              </section>
            );
          })}
        </div>

        {historial.length > 0 && (
          <section aria-labelledby="historial">
            <TituloBloque ojo="Lo que ya hiciste" titulo="Tu historial" id="historial" />
            <div className="tarjeta desplazable">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estudio</th>
                    <th>Estado</th>
                    <th className="num">Global</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(({ i, global }) => (
                    <tr key={i.id}>
                      <td>{formatoFecha(i.iniciaEn, { day: "numeric", month: "short" })}</td>
                      <td>{{ diagnostico: "Diagnóstico", simulacro: "Simulacro", muestra: "Muestra", mini: "Mini" }[i.modo]}</td>
                      <td>{{ en_curso: "En curso", enviado: "Calificado", abandonado: "Abandonado" }[i.estado]}</td>
                      <td className="num">{global == null ? "—" : Math.round(Number(global))}</td>
                      <td>
                        {i.estado === "en_curso" ? <Link href={`/examen/${i.id}`}>Seguir</Link> : i.estado === "enviado" ? <Link href={`/examen/${i.id}/resultado`}>Ver resultado</Link> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section aria-labelledby="area">
          <TituloBloque ojo="¿Cambiaste de carrera?" titulo="Tu área o carrera" id="area" />
          <form action={cambiarRuta} className="tarjeta fila" style={{ alignItems: "end", flexDirection: "row" }}>
            <label className="campo" style={{ flex: "1 1 320px" }}>
              Las preguntas salen del banco de esta área
              <span className="ayuda">
                {regla.motivo === "plan"
                  ? "Tu plan cubre estas áreas. Para estudiar otra, compra su plan."
                  : regla.bloqueadoHasta
                    ? `Puedes cambiar de área una vez cada 30 días. La próxima vez: ${formatoFecha(regla.bloqueadoHasta, { day: "numeric", month: "long" })}.`
                    : "Puedes cambiar de área una vez cada 30 días, así que elige la de la carrera a la que vas a aplicar."}{" "}
                {general ? (
                  <Link href={`/carreras/${general.slug}`}>Ver las carreras de {general.corto}</Link>
                ) : (
                  <Link href="/carreras">Ver las áreas generales</Link>
                )}
              </span>
              <select name="ruta" defaultValue={ruta} disabled={!!regla.bloqueadoHasta || opciones.length < 2}>
                {opciones.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn sec chico" disabled={!!regla.bloqueadoHasta || opciones.length < 2}>
              Cambiar de área
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
