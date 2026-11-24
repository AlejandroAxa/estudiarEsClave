import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { diaMx, lunesDe, sumarDias, formatoFecha } from "@/lib/fechas";
import { puntosSemana, puntosTotales, rachaVigente } from "@/lib/motivacion/motivacion";

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

  return (
    <div className="wrap band pila">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Liga semanal</h1>
      <p className="lead">
        Compites solo con tu alias, contra unas 30 personas de tu división. Los puntos salen de estudiar, no de pagar: secciones terminadas,
        aciertos en práctica y días seguidos.
      </p>
      <div className="rejilla rejilla-4">
        <div className="tarjeta-dato">
          <span className="small">Esta semana</span>
          <span className="cifra">{semanaPts}</span>
        </div>
        <div className="tarjeta-dato">
          <span className="small">Racha</span>
          <span className="cifra">{rachaVigente(racha)} días</span>
        </div>
        <div className="tarjeta-dato">
          <span className="small">Mejor racha</span>
          <span className="cifra">{racha?.mejor ?? 0}</span>
        </div>
        <div className="tarjeta-dato">
          <span className="small">Puntos totales</span>
          <span className="cifra">{total}</span>
        </div>
      </div>

      <section className="hoja pila">
        {!ses.perfil.visibleEnRanking ? (
          <p>
            Tienes la liga oculta. Tus puntos se siguen contando, pero nadie ve tu alias. Puedes volver a mostrarte en <Link href="/cuenta">tu cuenta</Link>.
          </p>
        ) : !mia ? (
          <p>Aún no sumas puntos esta semana. Termina una sección o contesta preguntas de práctica para entrar a la liga.</p>
        ) : (
          <>
            <div className="entre">
              <h2 style={{ fontSize: 26 }}>División {NOMBRE_DIVISION[mia.division]}</h2>
              <span className="small">Cierra el lunes {formatoFecha(cierra, { day: "numeric", month: "long" })}</span>
            </div>
            <p className="small">Los 5 primeros suben de división. Si el grupo tiene más de 10 personas, los 5 últimos bajan.</p>
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Alias</th>
                  <th className="num">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((f, i) => (
                  <tr key={f.cuentaId} aria-current={f.cuentaId === ses.cuenta.id ? "true" : undefined} style={f.cuentaId === ses.cuenta.id ? { fontWeight: 700 } : undefined}>
                    <td className="num">{i + 1}</td>
                    <td>{f.alias}{f.cuentaId === ses.cuenta.id ? " (tú)" : ""}</td>
                    <td className="num">{f.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="hoja pila">
        <h2 style={{ fontSize: 26 }}>Insignias</h2>
        <div className="rejilla">
          {insignias.map(({ i, en }) => (
            <div key={i.id} className="tarjeta-dato" style={en ? undefined : { opacity: 0.45 }}>
              <b>{i.nombre}</b>
              <span className="small">{i.descripcion}</span>
              {en && <span className="xs">Obtenida el {formatoFecha(en, { day: "numeric", month: "short" })}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
