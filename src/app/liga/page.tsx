import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { diaMx, lunesDe, sumarDias, formatoFecha } from "@/lib/fechas";
import { aciertosPorMateria, MEDALLA_CADA, PUNTOS, puntosSemana, puntosTotales, rachaVigente } from "@/lib/motivacion/motivacion";
import { Award, ChevronsDown, ChevronsUp, Crown, Flame, Lock, Shield } from "lucide-react";
import { CabeceraApp, TituloBloque } from "@/components/cabecera-app";
import { Medalla } from "@/components/medalla";
import { ProfeTomas } from "@/components/profe";
import { plural, temaDeRuta } from "@/lib/tema-area";

export const metadata: Metadata = { title: "Liga semanal" };

const DIVISIONES = [
  { id: "bronce", nombre: "Bronce" },
  { id: "plata", nombre: "Plata" },
  { id: "oro", nombre: "Oro" },
] as const;
const NOMBRE_DIVISION: Record<string, string> = { bronce: "Bronce", plata: "Plata", oro: "Oro" };
/** A partir de cuántos aciertos seguidos se ve la flamita «en racha» en el marcador. */
const EN_RACHA = 3;

export default async function Liga() {
  const ses = await requerirAlumno("/liga");
  const semana = lunesDe(diaMx());
  const [mia] = await db
    .select()
    .from(s.clasificacionSemanal)
    .where(and(eq(s.clasificacionSemanal.semana, semana), eq(s.clasificacionSemanal.cuentaId, ses.cuenta.id)));
  const tabla = mia
    ? await db
        .select({
          cuentaId: s.clasificacionSemanal.cuentaId,
          puntos: s.clasificacionSemanal.puntos,
          mejorRacha: s.clasificacionSemanal.mejorRachaAciertos,
          rachaAhora: s.racha.aciertosSeguidos,
          alias: s.perfilAlumno.alias,
        })
        .from(s.clasificacionSemanal)
        .innerJoin(s.perfilAlumno, eq(s.perfilAlumno.cuentaId, s.clasificacionSemanal.cuentaId))
        .leftJoin(s.racha, eq(s.racha.cuentaId, s.clasificacionSemanal.cuentaId))
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
  const porMateria = await aciertosPorMateria(db, ses.cuenta.id);
  const materias = porMateria.size
    ? (
        await db
          .select({ id: s.subarea.id, nombre: s.subarea.nombre, area: s.area.nombre })
          .from(s.subarea)
          .innerJoin(s.area, eq(s.area.id, s.subarea.areaId))
          .where(inArray(s.subarea.id, [...porMateria.keys()]))
      )
        .map((m) => ({ ...m, aciertos: porMateria.get(m.id) ?? 0 }))
        .sort((a, b) => b.aciertos - a.aciertos)
    : [];
  const totalMedallas = materias.reduce((n, m) => n + Math.floor(m.aciertos / MEDALLA_CADA), 0);
  const cierra = sumarDias(semana, 7);

  const tema = temaDeRuta(ses.perfil.rutaId);
  const rachaHoy = rachaVigente(racha);
  const miLugar = tabla.findIndex((f) => f.cuentaId === ses.cuenta.id) + 1;
  const ganadas = insignias.filter((x) => x.en).length;
  const lider = Math.max(1, tabla[0]?.puntos ?? 1);
  const bajan = tabla.length > 10 ? tabla.length - 5 : Infinity;
  const divIdx = DIVISIONES.findIndex((d) => d.id === (mia?.division ?? "bronce"));

  // Lo que le falta para subir (o con cuánto aire va).
  const meta = (() => {
    if (!mia || !miLugar) return null;
    if (miLugar <= 5) {
      const sexto = tabla[5];
      return { sube: true, texto: sexto ? `Vas en zona de ascenso. Le llevas ${mia.puntos - sexto.puntos} puntos al #6.` : "Vas en zona de ascenso. ¡Cuídala hasta el lunes!" };
    }
    const quinto = tabla[4];
    const faltan = quinto.puntos - mia.puntos + 1;
    return { sube: false, texto: `Te faltan ${faltan} puntos para entrar al top 5. Son unos ${Math.ceil(faltan / PUNTOS.acierto)} aciertos.` };
  })();

  const podio = tabla.slice(0, 3);
  const resto = tabla.slice(3);

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
        sub="Compites solo con tu alias, contra unas 30 personas. Los puntos salen de estudiar, no de pagar: aciertos, rachas, medallas, secciones y días seguidos."
        acciones={<span className="pastilla">Cierra el lunes {formatoFecha(cierra, { day: "numeric", month: "long" })}</span>}
        cifras={[
          { valor: miLugar ? `#${miLugar}` : "—", etiqueta: "Tu lugar" },
          { valor: semanaPts.toLocaleString("es-MX"), etiqueta: "Puntos esta semana", nota: `Totales: ${total.toLocaleString("es-MX")}` },
          { valor: racha?.aciertosSeguidos ?? 0, etiqueta: "Aciertos seguidos", nota: `Mejor: ${racha?.mejorAciertos ?? 0}` },
          { valor: rachaHoy, etiqueta: plural(rachaHoy, tema.racha), nota: `Mejor: ${racha?.mejor ?? 0}` },
        ]}
      />
      <div className="wrap app-cuerpo">
        <section aria-labelledby="tabla" className="liga">
          <TituloBloque ojo="Esta semana" titulo={mia ? `Tu grupo · ${NOMBRE_DIVISION[mia.division]}` : "Tu grupo"} id="tabla">
            {mia && "Los 5 primeros suben de división. Si hay más de 10, los 5 últimos bajan."}
          </TituloBloque>

          <ol className="liga-divisiones" aria-label="Divisiones">
            {DIVISIONES.map((d, k) => (
              <li key={d.id} className={`div-${d.id} ${k === divIdx ? "actual" : k < divIdx ? "pasada" : ""}`}>
                <Shield size={22} aria-hidden />
                <span>{d.nombre}</span>
                {k === divIdx && <span className="sr-only">(tu división)</span>}
              </li>
            ))}
          </ol>

          {!ses.perfil.visibleEnRanking ? (
            <div className="vacio">
              <h3>Tienes la liga oculta</h3>
              <p>Tus puntos se siguen contando, pero nadie ve tu alias.</p>
              <Link href="/cuenta" className="btn sec chico">
                Mostrarme en la liga
              </Link>
            </div>
          ) : !mia ? (
            <div className="vacio liga-vacio">
              <ProfeTomas animo="animo" className="liga-vacio-profe" />
              <div>
                <h3>Aún no sumas puntos esta semana</h3>
                <p>Contesta preguntas de práctica o termina una sección de diagnóstico para entrar a tu grupo.</p>
                <Link href="/practica" className="btn chico">
                  Ir a practicar
                </Link>
              </div>
            </div>
          ) : (
            <>
              {meta && (
                <div className={`liga-meta ${meta.sube ? "sube" : ""}`}>
                  <ProfeTomas animo={meta.sube ? "festejo" : "feliz"} className="liga-meta-profe" />
                  <p>
                    <b>{meta.sube ? "¡Vas subiendo!" : "¡Tú puedes!"}</b> {meta.texto}
                  </p>
                </div>
              )}

              <ol className="podio" aria-label="Primeros lugares">
                {podio.map((f, i) => (
                  <li key={f.cuentaId} className={`podio-${i + 1}`} aria-current={f.cuentaId === ses.cuenta.id ? "true" : undefined}>
                    {i === 0 && <Crown className="podio-corona" size={26} aria-hidden />}
                    <span className="podio-avatar" aria-hidden>
                      {f.alias.slice(0, 1).toUpperCase()}
                    </span>
                    <b className="podio-alias">
                      {f.alias}
                      {f.cuentaId === ses.cuenta.id ? " (tú)" : ""}
                    </b>
                    <span className="podio-puntos">{f.puntos.toLocaleString("es-MX")} pts</span>
                    <RachaChip mejor={f.mejorRacha} ahora={f.rachaAhora ?? 0} />
                    <span className="podio-escalon" aria-hidden>
                      {i + 1}
                    </span>
                  </li>
                ))}
              </ol>

              {resto.length > 0 && (
                <ol className="marcador" start={4} aria-label="Resto del grupo">
                  {resto.map((f, k) => {
                    const lugar = k + 4;
                    return (
                      <li
                        key={f.cuentaId}
                        className={`${lugar <= 5 ? "zona-sube" : lugar > bajan ? "zona-baja" : ""}`}
                        aria-current={f.cuentaId === ses.cuenta.id ? "true" : undefined}
                      >
                        {lugar === 6 && (
                          <span className="marcador-corte sube" aria-hidden>
                            <ChevronsUp size={14} /> Zona de ascenso arriba
                          </span>
                        )}
                        {lugar === bajan + 1 && (
                          <span className="marcador-corte baja" aria-hidden>
                            <ChevronsDown size={14} /> Zona de descenso
                          </span>
                        )}
                        <span className="marcador-lugar">{lugar}</span>
                        <span className="marcador-avatar" aria-hidden>
                          {f.alias.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="marcador-alias">
                          {f.alias}
                          {f.cuentaId === ses.cuenta.id ? " (tú)" : ""}
                          <span className="marcador-barra" aria-hidden>
                            <span style={{ width: `${(f.puntos / lider) * 100}%` }} />
                          </span>
                        </span>
                        <RachaChip mejor={f.mejorRacha} ahora={f.rachaAhora ?? 0} />
                        <span className="marcador-puntos">
                          {f.puntos.toLocaleString("es-MX")}
                          <small> pts</small>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
              <p className="xs liga-leyenda">
                <Flame size={13} aria-hidden /> La flama es la racha de aciertos más larga de la semana; encendida, la persona va en racha ahora mismo.
              </p>
            </>
          )}

          <ul className="liga-puntos" aria-label="Cómo se ganan puntos">
            <li>
              <b>+{PUNTOS.acierto}</b> por acierto
            </li>
            <li>
              <b>+5 a +50</b> por racha de aciertos (3, 5, 10, 15, 20…)
            </li>
            <li>
              <b>+{PUNTOS.insignia}</b> por medalla o insignia
            </li>
            <li>
              <b>+{PUNTOS.dia}</b> por día de estudio
            </li>
            <li>
              <b>+{PUNTOS.seccion}</b> por sección de diagnóstico
            </li>
          </ul>
        </section>

        <section aria-labelledby="medallas">
          <TituloBloque ojo="Por materia" titulo="Medallas" id="medallas">
            {totalMedallas} {totalMedallas === 1 ? "medalla" : "medallas"} · una por cada {MEDALLA_CADA} aciertos en la misma materia
          </TituloBloque>
          {materias.length === 0 ? (
            <div className="vacio">
              <h3>Tu primera medalla te espera</h3>
              <p>Acierta {MEDALLA_CADA} preguntas de práctica de una misma materia. Bronce, plata, oro y después diamante.</p>
              <Link href="/practica" className="btn chico">
                Practicar por materia
              </Link>
            </div>
          ) : (
            <ul className="medallas">
              {materias.map((m) => {
                const n = Math.floor(m.aciertos / MEDALLA_CADA);
                const resto = m.aciertos % MEDALLA_CADA;
                return (
                  <li key={m.id} className={n ? "ganada" : undefined}>
                    <Medalla numero={n} tamano={52} titulo={n ? `${n} medallas` : "Sin medalla todavía"} />
                    <div>
                      <span className="xs">{m.area}</span>
                      <b>{m.nombre}</b>
                      <span className="barra-medalla" aria-hidden>
                        <span style={{ width: `${(resto / MEDALLA_CADA) * 100}%` }} />
                      </span>
                      <span className="xs">
                        {m.aciertos} aciertos · faltan {MEDALLA_CADA - resto} para la {n + 1}.ª
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
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

function RachaChip({ mejor, ahora }: { mejor: number; ahora: number }) {
  const encendida = ahora >= EN_RACHA;
  return (
    <span className={`racha-liga ${encendida ? "encendida" : ""} ${mejor ? "" : "apagada"}`} title={`Mejor racha de la semana: ${mejor}${encendida ? ` · ahora lleva ${ahora}` : ""}`}>
      <Flame size={15} aria-hidden />
      {mejor}
      <span className="sr-only">
        {" "}
        aciertos seguidos como mejor racha de la semana{encendida ? `, va en racha de ${ahora}` : ""}
      </span>
    </span>
  );
}
