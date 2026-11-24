/**
 * Motor de diagnóstico diag-1 (sección 7 del modelo). Funciones puras: no
 * tocan la base de datos, así que se prueban con casos fijos.
 */

export const VERSION_ALGORITMO = "diag-1";

export type Nivel = "Dominas" | "En desarrollo" | "Área de oportunidad";

export interface TaxTema {
  id: string;
  nombre: string;
}
export interface TaxSubarea {
  id: string;
  nombre: string;
  peso: number;
  temas: TaxTema[];
}
export interface TaxArea {
  id: string;
  nombre: string;
  cuentaPuntaje: boolean;
  subareas: TaxSubarea[];
}
export type Taxonomia = TaxArea[];

export interface ItemCalificable {
  reactivoId: string;
  temaId: string;
  subareaId: string;
  areaId: string;
  /** R1: no respondida cuenta como presentada y fallada, sin error_id. */
  correcta: boolean;
  errorId: string | null;
}

export interface Umbrales {
  domina: number;
  desarrollo: number;
  minimo: number;
}

export const UMBRALES_BASE: Umbrales = { domina: 0.8, desarrollo: 0.5, minimo: 3 };

export interface Medida {
  id: string;
  nombre: string;
  presentados: number;
  aciertos: number;
  /** Nulo = «datos insuficientes». */
  dominio: number | null;
  nivel: Nivel | null;
}
export interface MedidaSubarea extends Medida {
  areaId: string;
  peso: number;
  prioridad: number | null;
  lugarPrioridad: number | null;
}
export interface MedidaArea extends Medida {
  /** Dominio simple (aciertos/presentados), útil para el mini diagnóstico. */
  dominioSimple: number | null;
}
export interface MedidaTema extends Medida {
  subareaId: string;
}
export interface ErrorDetectado {
  errorId: string;
  veces: number;
  lugar: number;
}

export interface ResultadoDiagnostico {
  versionAlgoritmo: string;
  /** 0 a 100, nulo si ninguna subárea tiene datos suficientes. */
  global: number | null;
  nivel: Nivel | null;
  cobertura: number;
  parcial: boolean;
  areas: MedidaArea[];
  subareas: MedidaSubarea[];
  temas: MedidaTema[];
  prioridades: MedidaSubarea[];
  errores: ErrorDetectado[];
  totalPresentados: number;
  totalAciertos: number;
}

export function nivelDe(dominio: number | null, u: Umbrales): Nivel | null {
  if (dominio == null) return null;
  if (dominio >= u.domina) return "Dominas";
  if (dominio >= u.desarrollo) return "En desarrollo";
  return "Área de oportunidad";
}

/** Redondeo estable para guardar y comparar (evita 0.1+0.2). */
const r4 = (x: number) => Math.round(x * 10000) / 10000;

function medir(items: ItemCalificable[], u: Umbrales) {
  const presentados = items.length;
  const aciertos = items.filter((i) => i.correcta).length;
  const dominio = presentados >= u.minimo ? r4(aciertos / presentados) : null;
  return { presentados, aciertos, dominio, nivel: nivelDe(dominio, u) };
}

export function calificar(items: ItemCalificable[], taxonomia: Taxonomia, umbrales: Umbrales = UMBRALES_BASE): ResultadoDiagnostico {
  const u = umbrales;
  const porSub = new Map<string, ItemCalificable[]>();
  const porTema = new Map<string, ItemCalificable[]>();
  const porArea = new Map<string, ItemCalificable[]>();
  for (const it of items) {
    (porSub.get(it.subareaId) ?? porSub.set(it.subareaId, []).get(it.subareaId)!).push(it);
    (porTema.get(it.temaId) ?? porTema.set(it.temaId, []).get(it.temaId)!).push(it);
    (porArea.get(it.areaId) ?? porArea.set(it.areaId, []).get(it.areaId)!).push(it);
  }

  const subareas: MedidaSubarea[] = [];
  const temas: MedidaTema[] = [];
  const areas: MedidaArea[] = [];
  const pesoSub = new Map<string, number>();
  const ordenSub = new Map<string, number>();

  let orden = 0;
  for (const a of taxonomia) {
    const subsArea: MedidaSubarea[] = [];
    for (const s of a.subareas) {
      pesoSub.set(s.id, s.peso);
      ordenSub.set(s.id, orden++);
      const m = medir(porSub.get(s.id) ?? [], u);
      // Se calcula con la fracción exacta, no con el dominio redondeado, para que los empates sean exactos.
      const prioridad = m.dominio == null ? null : r4((s.peso * (m.presentados - m.aciertos)) / m.presentados);
      const ms: MedidaSubarea = { id: s.id, nombre: s.nombre, areaId: a.id, peso: s.peso, ...m, prioridad, lugarPrioridad: null };
      subareas.push(ms);
      subsArea.push(ms);
      for (const t of s.temas) {
        temas.push({ id: t.id, nombre: t.nombre, subareaId: s.id, ...medir(porTema.get(t.id) ?? [], u) });
      }
    }
    // R4: dominio del área ponderado por el peso de sus subáreas con datos.
    const conDatos = subsArea.filter((s) => s.dominio != null);
    const w = conDatos.reduce((acc, s) => acc + s.peso, 0);
    const dominio = w > 0 ? r4(conDatos.reduce((acc, s) => acc + s.dominio! * s.peso, 0) / w) : null;
    const simple = medir(porArea.get(a.id) ?? [], u);
    areas.push({
      id: a.id,
      nombre: a.nombre,
      presentados: simple.presentados,
      aciertos: simple.aciertos,
      dominio,
      nivel: nivelDe(dominio, u),
      dominioSimple: simple.dominio,
    });
  }

  // R5: global ponderada sobre subáreas con datos de áreas que cuentan puntaje.
  const cuentan = new Set(taxonomia.filter((a) => a.cuentaPuntaje).map((a) => a.id));
  const subsCuentan = subareas.filter((s) => cuentan.has(s.areaId));
  const S = subsCuentan.filter((s) => s.dominio != null);
  const wS = S.reduce((acc, s) => acc + s.peso, 0);
  const wTotal = subsCuentan.reduce((acc, s) => acc + s.peso, 0);
  const global = wS > 0 ? Math.round((S.reduce((acc, s) => acc + s.dominio! * s.peso, 0) / wS) * 10000) / 100 : null;
  const cobertura = wTotal > 0 ? r4(wS / wTotal) : 0;

  // R6: prioridades. Empates: mayor peso, menor dominio, orden de la taxonomía.
  const prioridades = subareas
    .filter((s) => s.prioridad != null && s.nivel !== "Dominas")
    .sort(
      (x, y) =>
        y.prioridad! - x.prioridad! || y.peso - x.peso || x.dominio! - y.dominio! || ordenSub.get(x.id)! - ordenSub.get(y.id)!,
    )
    .slice(0, 3);
  prioridades.forEach((p, i) => (p.lugarPrioridad = i + 1));

  // R7: errores frecuentes (2 o más), empate por suma de pesos de las subáreas donde ocurrieron.
  const conteo = new Map<string, { veces: number; subs: Set<string> }>();
  for (const it of items) {
    if (it.correcta || !it.errorId) continue;
    const c = conteo.get(it.errorId) ?? { veces: 0, subs: new Set<string>() };
    c.veces++;
    c.subs.add(it.subareaId);
    conteo.set(it.errorId, c);
  }
  const errores = [...conteo.entries()]
    .filter(([, c]) => c.veces >= 2)
    .map(([errorId, c]) => ({ errorId, veces: c.veces, peso: [...c.subs].reduce((a, s) => a + (pesoSub.get(s) ?? 0), 0) }))
    .sort((x, y) => y.veces - x.veces || y.peso - x.peso || x.errorId.localeCompare(y.errorId))
    .slice(0, 3)
    .map((e, i) => ({ errorId: e.errorId, veces: e.veces, lugar: i + 1 }));

  return {
    versionAlgoritmo: VERSION_ALGORITMO,
    global,
    nivel: nivelDe(global == null ? null : global / 100, u),
    cobertura,
    parcial: cobertura < 0.8,
    areas,
    subareas,
    temas,
    prioridades,
    errores,
    totalPresentados: items.length,
    totalAciertos: items.filter((i) => i.correcta).length,
  };
}

/** R8: comparar dos resultados de la misma familia por subárea. */
export function compararAvance(antes: MedidaSubarea[], despues: MedidaSubarea[]) {
  const previo = new Map(antes.map((s) => [s.id, s]));
  return despues.map((d) => {
    const a = previo.get(d.id);
    const diferencia = a?.dominio != null && d.dominio != null ? Math.round((d.dominio - a.dominio) * 100) : null;
    const mejoraReal = diferencia != null && diferencia >= 15 && (a?.presentados ?? 0) >= 5 && d.presentados >= 5;
    return { id: d.id, nombre: d.nombre, antes: a?.dominio ?? null, despues: d.dominio, diferencia, mejoraReal };
  });
}
