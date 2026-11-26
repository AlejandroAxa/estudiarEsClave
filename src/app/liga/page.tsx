import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { diaMx, lunesDe, sumarDias, formatoFecha } from "@/lib/fechas";
import { puntosSemana, puntosTotales, rachaVigente } from "@/lib/motivacion/motivacion";
import { Award, Lock } from "lucide-react";
import { CabeceraApp, TituloBloque } from "@/components/cabecera-app";
import { plural, temaDeRuta } from "@/lib/tema-area";

export const metadata: Metadata = { title: "Liga semanal" };

const NOMBRE_DIVISION: Record<string, string> = { bronce: "Bronce", plata: "Plata", oro: "Oro" };

export default async function Liga() {
  const ses = await requerirAlumno("/liga");
  const semana = lunesDe(diaMx());
  const [mia] = await db
    .select()
    .from(s.clasificacionSemanal)
    .where(and(eq(s.clasificacionSemanal.semana, semana), eq(s.clasificacionSemanal.cuentaId, ses.cuenta.id)));
  const tabla = mia
    ? await db
        .select({ cuentaId: s.clasificacionSemanal.cuentaId, puntos: s.clasificacionSemanal.puntos, alias: s.perfilAlumno.alias })
        .from(s.clasificacionSemanal)
        .innerJoin(s.perfilAlumno, eq(s.perfilAlumno.cuentaId, s.clasificacionSemanal.cuentaId))
        .where(
          and(
            eq(s.clasificacionSemanal.semana, semana),
            eq(s.clasificacionSemanal.division, mia.division),
            eq(s.clasificacionSemanal.grupo, mia.grupo),
            eq(s.perfilAlumno.visibleEnRanking, true),
          ),
        )
        .orderBy(desc(s.clasificacionSemanal.puntos))
        .limit(30)
    : [];
  const [racha] = await db.select().from(s.racha).where(eq(s.racha.cuentaId, ses.cuenta.id));
  const semanaPts = await puntosSemana(db, ses.cuenta.id);
  const total = await puntosTotales(db, ses.cuenta.id);
  const insignias = await db
    .select({ i: s.insignia, en: s.cuentaInsignia.obtenidaEn })
    .from(s.insignia)
    .leftJoin(s.cuentaInsignia, and(eq(s.cuentaInsignia.insigniaId, s.insignia.id), eq(s.cuentaInsignia.cuentaId, ses.cuenta.id)));
  const cierra = sumarDias(semana, 7);

  const tema = temaDeRuta(ses.perfil.rutaId);
  const rachaHoy = rachaVigente(racha);
  const miLugar = tabla.findIndex((f) => f.cuentaId === ses.cuenta.id) + 1;
  const ganadas = insignias.filter((x) => x.en).length;

  return (
    <>
      <CabeceraApp
        tema={tema.tema}
        acento={tema.acento}
        ceja={mia ? `División ${NOMBRE_DIVISION[mia.division]}` : "Liga semanal"}
        titulo={
          <>
            Liga <em>semanal</em>
          </>
        }
        sub="Compites solo con tu alias, contra unas 30 personas. Los puntos salen de estudiar, no de pagar: secciones terminadas, aciertos en práctica y días seguidos."
        acciones={<span className="pastilla">Cierra el lunes {formatoFecha(cierra, { day: "numeric", month: "long" })}</span>}
        cifras={[
          { valor: miLugar ? `#${miLugar}` : "—", etiqueta: "Tu lugar" },
          { valor: semanaPts.toLocaleString("es-MX"), etiqueta: "Puntos esta semana" },
          { valor: rachaHoy, etiqueta: plural(rachaHoy, tema.racha), nota: `Mejor: ${racha?.mejor ?? 0}` },
          { valor: total.toLocaleString("es-MX"), etiqueta: "Puntos totales" },
        ]}
      />
      <div className="wrap app-cuerpo">
        <section aria-labelledby="tabla">
          <TituloBloque ojo="Esta semana" titulo={mia ? `Tu grupo · ${NOMBRE_DIVISION[mia.division]}` : "Tu grupo"} id="tabla">
            {mia && "Los 5 primeros suben de división. Si hay más de 10, los 5 últimos bajan."}
          </TituloBloque>
          {!ses.perfil.visibleEnRanking ? (
            <div className="vacio">
              <h3>Tienes la liga oculta</h3>
              <p>Tus puntos se siguen contando, pero nadie ve tu alias.</p>
              <Link href="/cuenta" className="btn sec chico">
                Mostrarme en la liga
              </Link>
            </div>
          ) : !mia ? (
            <div className="vacio">
              <h3>Aún no sumas puntos esta semana</h3>
              <p>Contesta preguntas de práctica o termina una sección de diagnóstico para entrar a tu grupo.</p>
              <Link href="/practica" className="btn chico">
                Ir a practicar
              </Link>
            </div>
          ) : (
            <div className="tarjeta desplazable">
              <table className="tabla tabla-liga">
                <thead>
                  <tr>
                    <th className="num">#</th>
                    <th>Alias</th>
                    <th className="num">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.map((f, i) => (
                    <tr key={f.cuentaId} aria-current={f.cuentaId === ses.cuenta.id ? "true" : undefined} className={i < 5 ? "sube" : undefined}>
                      <td className="num">{i + 1}</td>
                      <td>
                        {f.alias}
                        {f.cuentaId === ses.cuenta.id ? " (tú)" : ""}
                      </td>
                      <td className="num">{f.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="insignias">
          <TituloBloque ojo="Logros" titulo="Insignias" id="insignias">
            {ganadas} de {insignias.length} ganadas
          </TituloBloque>
          <ul className="insignias">
            {insignias.map(({ i, en }) => (
              <li key={i.id} className={en ? "ganada" : undefined}>
                <span className="medalla">{en ? <Award size={20} aria-hidden /> : <Lock size={16} aria-hidden />}</span>
                <b>{i.nombre}</b>
                <p className="small">
                  {i.descripcion}
                  {en && <span className="xs"> · {formatoFecha(en, { day: "numeric", month: "short" })}</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
