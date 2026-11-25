import Link from "next/link";
import type { Metadata } from "next";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { cuota } from "@/lib/planes";
import { plantillaActiva } from "@/lib/evaluacion/evaluacion";
import { formatoFecha } from "@/lib/fechas";
import { BotonEmpezar } from "./boton";
import { rutasElegibles } from "@/lib/consultas";
import { OPCIONES_MINI, areaGeneralPorRuta } from "@/lib/areas-generales";
import { cambiarRuta } from "@/app/acciones/perfil";
import { temaDeRuta } from "@/lib/tema-area";

export const metadata: Metadata = { title: "Diagnóstico y simulacros" };

export default async function Diagnostico({ searchParams }: { searchParams: Promise<{ area?: string; cambio?: string }> }) {
  const { area, cambio } = await searchParams;
  const ses = await requerirAlumno(area ? `/diagnostico?area=${encodeURIComponent(area)}` : "/diagnostico");
  const ruta = ses.perfil.rutaId;
  const rutas = (await rutasElegibles()).filter((r) => r.examenId === ses.perfil.examenId);
  const actual = rutas.find((r) => r.id === ruta);
  const pedida = area ? OPCIONES_MINI.find((o) => o.slug === area) : undefined;
  const sugerida = pedida && pedida.id !== ruta && rutas.some((r) => r.id === pedida.id) ? pedida : undefined;
  const general = areaGeneralPorRuta(ruta);
  const modos = [
    { modo: "diagnostico", titulo: "Diagnóstico completo", texto: "Por secciones, una por área, con pausa entre ellas. Te da tus 3 prioridades." },
    { modo: "simulacro", titulo: "Simulacro cronometrado", texto: "Todo seguido y con un solo cronómetro, como el día del examen." },
    { modo: "muestra", titulo: "Simulacro de muestra", texto: "20 minutos para sentir el ritmo del examen real." },
  ] as const;
  const tarjetas = await Promise.all(
    modos.map(async (m) => {
      const pl = await plantillaActiva(db, ruta, m.modo);
      const c = await cuota(db, ses.cuenta.id, m.modo);
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
  return (
    <div className="wrap band pila">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>{temaDeRuta(ruta).diagnostico}</h1>
      <p className="lead">Elige tu estudio. Durante el examen no verás qué acertaste: todo se califica al final, en el servidor.</p>
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
      {cambio && !sugerida && <p className="aviso ok" role="status">Listo: tus exámenes ya salen del banco de {actual?.nombre ?? ruta}.</p>}
      <form action={cambiarRuta} className="hoja fila" style={{ alignItems: "end" }}>
        <label className="campo" style={{ flex: "1 1 320px" }}>
          Tu área o carrera
          <span className="ayuda">
            Las preguntas salen del banco de esta área.{" "}
            {general ? (
              <Link href={`/carreras/${general.slug}`}>Ver las carreras de {general.corto}</Link>
            ) : (
              <Link href="/carreras">Ver las áreas generales</Link>
            )}
          </span>
          <select name="ruta" defaultValue={ruta}>
            {rutas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </label>
        <button className="btn sec chico">Cambiar de área</button>
      </form>
      <div className="rejilla">
        {tarjetas.map((t) => (
          <div key={t.modo} className="hoja pila">
            <h2 style={{ fontSize: 24 }}>{t.titulo}</h2>
            <p className="small">{t.texto}</p>
            {t.pl ? <p className="xs">{t.pl.tiempoLimiteMin} minutos en total</p> : <p className="xs">Aún no disponible para tu carrera.</p>}
            {t.pl && <BotonEmpezar modo={t.modo} permitido={t.c.permitido} muro={t.c.textoMuro} />}
            {t.c.cantidad != null && t.c.cantidad > 0 && (
              <p className="xs">
                Plan {t.c.plan}: {t.c.restante} de {t.c.cantidad} en la temporada
              </p>
            )}
          </div>
        ))}
      </div>
      {historial.length > 0 && (
        <section className="hoja">
          <h2 style={{ fontSize: 24 }}>Tu historial</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudio</th>
                <th>Estado</th>
                <th>Global</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {historial.map(({ i, global }) => (
                <tr key={i.id}>
                  <td>{formatoFecha(i.iniciaEn, { day: "numeric", month: "short" })}</td>
                  <td>{{ diagnostico: "Diagnóstico", simulacro: "Simulacro", muestra: "Muestra", mini: "Mini" }[i.modo]}</td>
                  <td>{{ en_curso: "En curso", enviado: "Calificado", abandonado: "Abandonado" }[i.estado]}</td>
                  <td>{global == null ? "—" : Math.round(Number(global))}</td>
                  <td>
                    {i.estado === "en_curso" ? <Link href={`/examen/${i.id}`}>Seguir</Link> : i.estado === "enviado" ? <Link href={`/examen/${i.id}/resultado`}>Ver</Link> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
