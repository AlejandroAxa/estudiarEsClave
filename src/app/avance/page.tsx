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

  return (
    <div className="wrap band pila">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Tu expediente</h1>
      <div className="rejilla">
        <div className="tarjeta-dato">
          <span className="small">Último diagnóstico</span>
          <span className="cifra">{d.ultimoGlobal == null ? "—" : Math.round(d.ultimoGlobal)}</span>
        </div>
        <div className="tarjeta-dato">
          <span className="small">Temas practicados</span>
          <span className="cifra">{d.temasEstudiados}</span>
        </div>
        <div className="tarjeta-dato">
          <span className="small">Preguntas de práctica</span>
          <span className="cifra">{d.preguntasPracticadas}</span>
        </div>
        <div className="tarjeta-dato">
          <span className="small">Diagnósticos</span>
          <span className="cifra">{d.diagnosticos}</span>
        </div>
      </div>

      <section className="hoja pila">
        <h2 style={{ fontSize: 26 }}>Comparar diagnósticos</h2>
        {comparables ? (
          <table className="lab">
            <thead>
              <tr>
                <th>Subárea</th>
                <th>Primero</th>
                <th>Último</th>
                <th>Cambio</th>
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
        ) : (
          <p className="small">
            Para comparar hacen falta dos diagnósticos de la misma forma. Solo resaltamos una mejora como real si sube 15 puntos o más, para no celebrar
            casualidades.
          </p>
        )}
      </section>

      <section id="compartir" className="hoja pila">
        <h2 style={{ fontSize: 26 }}>Compartir mi avance</h2>
        <p>Genera una gráfica de tu avance para mandarla a quien quieras. Se ve tu nombre de pila o alias, tu calificación estimada y los temas que llevas; nunca tus respuestas ni tu correo. El enlace vence en 30 días y lo puedes revocar.</p>
        <Compartir />
        {enlaces.length > 0 && (
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
        )}
      </section>
      {d.subareas.length === 0 && <p className="small">Cuando termines tu primer diagnóstico, aquí verás tu avance por subárea.</p>}
    </div>
  );
}
