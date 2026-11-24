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

export const metadata: Metadata = { title: "Diagnóstico y simulacros" };

export default async function Diagnostico() {
  const ses = await requerirAlumno("/diagnostico");
  const ruta = ses.perfil.rutaId;
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
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Laboratorio</h1>
      <p className="lead">Elige tu estudio. Durante el examen no verás qué acertaste: todo se califica al final, en el servidor.</p>
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
