import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { datosAvance, enlacesDe } from "@/lib/compartir";
import { compararAvance, type MedidaSubarea } from "@/lib/diagnostico/calificar";
import { formatoFecha } from "@/lib/fechas";
import { revocar } from "@/app/acciones/compartir";
import { Compartir } from "./compartir";
import Link from "next/link";
import { CabeceraApp, TituloBloque } from "@/components/cabecera-app";
import { temaDeRuta } from "@/lib/tema-area";

export const metadata: Metadata = { title: "Tu avance" };

export default async function Avance() {
  const ses = await requerirAlumno("/avance");
  const d = await datosAvance(db, ses.cuenta.id);
  const enlaces = (await enlacesDe(db, ses.cuenta.id)).filter((e) => e.tipo === "avance");
  // R8: comparar solo intentos de la misma familia de equivalencia.
  const diags = await db
    .select({ id: s.intento.id, familia: s.plantilla.familiaEquivalencia, en: s.intento.enviadoEn })
    .from(s.intento)
    .innerJoin(s.plantilla, eq(s.plantilla.id, s.intento.plantillaId))
    .where(and(eq(s.intento.cuentaId, ses.cuenta.id), eq(s.intento.modo, "diagnostico"), eq(s.intento.estado, "enviado")))
    .orderBy(asc(s.intento.enviadoEn));
  const sub = async (id: string) =>
    (await db.select({ r: s.resultadoSubarea, nombre: s.subarea.nombre }).from(s.resultadoSubarea).innerJoin(s.subarea, eq(s.subarea.id, s.resultadoSubarea.subareaId)).where(eq(s.resultadoSubarea.intentoId, id))).map(
      (x) => ({ id: x.r.subareaId, nombre: x.nombre, presentados: x.r.presentados, dominio: x.r.dominio == null ? null : Number(x.r.dominio) }) as unknown as MedidaSubarea,
    );
  const comparables = diags.length >= 2 && diags[0].familia === diags[diags.length - 1].familia;
  const comparacion = comparables ? compararAvance(await sub(diags[0].id), await sub(diags[diags.length - 1].id)) : [];

  const tema = temaDeRuta(ses.perfil.rutaId);
  const nivelDe = (x: number) => (x >= 0.7 ? "ok" : x >= 0.45 ? "mid" : "bad");

  return (
    <>
      <CabeceraApp
        tema={tema.tema}
        acento={tema.acento}
        ceja={tema.area}
        titulo={
          <>
            Tu <em>avance</em>
          </>
        }
        sub="Cómo vas en cada subárea según tu último diagnóstico, y cuánto has practicado."
        cifras={[
          { valor: d.ultimoGlobal == null ? "—" : Math.round(d.ultimoGlobal), etiqueta: "Último diagnóstico", nota: d.primerGlobal != null && d.diagnosticos > 1 ? `El primero fue ${Math.round(d.primerGlobal)}` : undefined },
          { valor: d.diagnosticos, etiqueta: "Diagnósticos" },
          { valor: d.preguntasPracticadas.toLocaleString("es-MX"), etiqueta: "Preguntas de práctica" },
          { valor: d.temasEstudiados, etiqueta: "Temas practicados" },
        ]}
      />
      <div className="wrap app-cuerpo">
        <section aria-labelledby="subareas">
          <TituloBloque ojo="Por subárea" titulo="Dónde estás" id="subareas">
            {d.subareas.length > 0 && (
              <span className="leyenda">
                <i className="ok" /> Dominas <i className="mid" /> En desarrollo <i className="bad" /> Área de oportunidad
              </span>
            )}
          </TituloBloque>
          {d.subareas.length === 0 ? (
            <div className="vacio">
              <h3>Aquí verás tu avance por subárea</h3>
              <p>Aparece en cuanto termines tu primer diagnóstico completo. Con el segundo verás cuánto subiste en cada una.</p>
              <Link href="/diagnostico" className="btn chico">
                Hacer mi diagnóstico
              </Link>
            </div>
          ) : (
            <div className="tarjeta">
              <ul className="barras">
                {d.subareas.map((x) => (
                  <li key={x.nombre}>
                    <span>{x.nombre}</span>
                    <span className="valor">{x.ahora == null ? "Sin datos" : `${Math.round(x.ahora * 100)} %`}</span>
                    <span className="pista" aria-hidden>
                      {x.antes != null && d.diagnosticos > 1 && <i className="antes" style={{ width: `${Math.round(x.antes * 100)}%` }} />}
                      {x.ahora != null && <i className={nivelDe(x.ahora)} style={{ width: `${Math.max(2, Math.round(x.ahora * 100))}%` }} />}
                    </span>
                  </li>
                ))}
              </ul>
              {d.diagnosticos > 1 && <p className="xs">La barra clara es tu primer diagnóstico.</p>}
            </div>
          )}
        </section>

        <section aria-labelledby="comparar">
          <TituloBloque ojo="Primero contra último" titulo="Comparar diagnósticos" id="comparar" />
          {comparables ? (
            <div className="tarjeta desplazable">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Subárea</th>
                    <th className="num">Primero</th>
                    <th className="num">Último</th>
                    <th className="num">Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {comparacion.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nombre}</td>
                      <td className="num">{c.antes == null ? "—" : `${Math.round(c.antes * 100)} %`}</td>
                      <td className="num">{c.despues == null ? "—" : `${Math.round(c.despues * 100)} %`}</td>
                      <td className="num">
                        {c.diferencia == null ? "—" : `${c.diferencia > 0 ? "+" : ""}${c.diferencia} pts`} {c.mejoraReal && <span className="sem ok">Mejora real</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="vacio">
              <h3>Hacen falta dos diagnósticos de la misma forma</h3>
              <p>Solo marcamos una mejora como real si sube 15 puntos o más, para no celebrar casualidades.</p>
            </div>
          )}
        </section>

        <section id="compartir" aria-labelledby="compartir-t">
          <TituloBloque ojo="Para tu familia o tu maestro" titulo="Compartir mi avance" id="compartir-t" />
          <div className="tarjeta">
            <p>
              Genera una gráfica de tu avance para mandarla a quien quieras. Se ve tu nombre de pila o alias, tu calificación estimada y los temas que
              llevas; nunca tus respuestas ni tu correo. El enlace vence en 30 días y lo puedes revocar.
            </p>
            <Compartir />
            {enlaces.length > 0 && (
              <div className="desplazable">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Creado</th>
                      <th>Vence</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enlaces.map((e) => {
                      const vivo = !e.revocadoEn && e.venceEn > new Date();
                      return (
                        <tr key={e.id}>
                          <td>{formatoFecha(e.creadoEn, { day: "numeric", month: "short" })}</td>
                          <td>{formatoFecha(e.venceEn, { day: "numeric", month: "short" })}</td>
                          <td>{e.revocadoEn ? "Revocado" : vivo ? "Activo" : "Vencido"}</td>
                          <td>
                            {vivo && (
                              <form action={revocar}>
                                <input type="hidden" name="id" value={e.id} />
                                <button className="btn disc">Revocar</button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
