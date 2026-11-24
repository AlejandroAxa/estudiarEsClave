/**
 * R10. Calibración nocturna: dificultad real (p), discriminación punto-biserial
 * y uso de distractores, solo con diagnósticos y simulacros enviados.
 * Las versiones con 100 respuestas o más que fallan algún umbral pasan a en_revision.
 */
import { sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";

export const MINIMO_CALIBRAR = 100;

export async function calibrar(db: Db) {
  await db.execute(sql`
    with base as (
      select r.reactivo_id, r.version, r.intento_id, r.correcta::int as c
      from respuesta r join intento i on i.id = r.intento_id
      where i.estado = 'enviado' and i.modo in ('diagnostico','simulacro') and r.opcion_id is not null
    ), tot as (
      select intento_id, sum(c) as s from base group by intento_id
    ), x as (
      select b.reactivo_id, b.version, b.c, (t.s - b.c)::float8 as resto
      from base b join tot t using (intento_id)
    )
    insert into estadistica_reactivo (reactivo_id, version, n, p, discriminacion, calculado_en)
    select reactivo_id, version, count(*), round(avg(c)::numeric, 4), round(coalesce(corr(c::float8, resto), 0)::numeric, 4), now()
    from x group by reactivo_id, version
    on conflict (reactivo_id, version) do update
      set n = excluded.n, p = excluded.p, discriminacion = excluded.discriminacion, calculado_en = now()`);

  await db.execute(sql`
    insert into estadistica_opcion (reactivo_id, version, opcion_id, veces_elegida)
    select r.reactivo_id, r.version, r.opcion_id, count(*)
    from respuesta r join intento i on i.id = r.intento_id
    where i.estado = 'enviado' and i.modo in ('diagnostico','simulacro') and r.opcion_id is not null
    group by 1, 2, 3
    on conflict (reactivo_id, version, opcion_id) do update set veces_elegida = excluded.veces_elegida`);

  const marcadas = await db.execute<{ reactivo_id: string; version: number; motivo: string }>(sql`
    with distractor as (
      select o.reactivo_id, o.version, min(coalesce(eo.veces_elegida, 0)::float8 / nullif(er.n, 0)) as minimo
      from opcion o
      join estadistica_reactivo er on er.reactivo_id = o.reactivo_id and er.version = o.version
      left join estadistica_opcion eo on eo.reactivo_id = o.reactivo_id and eo.version = o.version and eo.opcion_id = o.opcion_id
      where not o.correcta
      group by 1, 2
    ), m as (
      select er.reactivo_id, er.version,
        concat_ws('; ',
          case when er.p < 0.20 then 'p menor a 0.20' end,
          case when er.discriminacion < 0.15 then 'discriminación menor a 0.15' end,
          case when d.minimo < 0.05 then 'un distractor elegido por menos del 5 %' end) as motivo
      from estadistica_reactivo er join distractor d using (reactivo_id, version)
      where er.n >= ${MINIMO_CALIBRAR}
    )
    update estadistica_reactivo er
      set bandera_revision = m.motivo <> '', motivo_bandera = nullif(m.motivo, '')
      from m where m.reactivo_id = er.reactivo_id and m.version = er.version
      returning er.reactivo_id, er.version, m.motivo`);

  const filas = (marcadas as unknown as { rows: { reactivo_id: string; version: number; motivo: string }[] }).rows ?? [];
  const aRevision = filas.filter((f) => f.motivo);
  for (const f of aRevision) {
    await db.execute(sql`update reactivo_version set estado = 'en_revision' where reactivo_id = ${f.reactivo_id} and version = ${f.version} and estado = 'publicado'`);
    await db.execute(sql`insert into auditoria (accion, entidad, entidad_id) values ('calibracion_revision', 'reactivo_version', ${`${f.reactivo_id}@${f.version}`})`);
  }
  return { calibradas: filas.length, aRevision: aRevision.length };
}
