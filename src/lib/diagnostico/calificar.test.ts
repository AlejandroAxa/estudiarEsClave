import { describe, expect, it } from "vitest";
import { calificar, compararAvance, type ItemCalificable, type Taxonomia } from "./calificar";
import { describir } from "./descripcion";
import { barajar } from "../aleatorio";

const tax: Taxonomia = [
  {
    id: "CL",
    nombre: "Comprensión lectora",
    cuentaPuntaje: true,
    subareas: [
      { id: "CL-EST", nombre: "Ámbito de estudio", peso: 12, temas: [{ id: "CL-EST-ID", nombre: "Id" }] },
      { id: "CL-PS", nombre: "Participación social", peso: 6, temas: [{ id: "CL-PS-ID", nombre: "Id" }] },
    ],
  },
  {
    id: "QUI",
    nombre: "Química",
    cuentaPuntaje: true,
    subareas: [{ id: "QUI-FG", nombre: "Fundamentos generales", peso: 14, temas: [{ id: "QUI-FG-1", nombre: "T" }] }],
  },
  {
    id: "PRE",
    nombre: "Premedicina",
    cuentaPuntaje: true,
    subareas: [{ id: "PRE-AF", nombre: "Anatomía y fisiología", peso: 18, temas: [{ id: "PRE-AF-1", nombre: "T" }] }],
  },
];

function items(sub: string, area: string, tema: string, aciertos: number, total: number, error = "E-X"): ItemCalificable[] {
  return Array.from({ length: total }, (_, i) => ({
    reactivoId: `${sub}-${i}`,
    temaId: tema,
    subareaId: sub,
    areaId: area,
    correcta: i < aciertos,
    errorId: i < aciertos ? null : error,
  }));
}

describe("diag-1: ejemplo fijo de la sección 7", () => {
  const r = calificar(
    [
      ...items("PRE-AF", "PRE", "PRE-AF-1", 5, 9, "E-PRE"),
      ...items("QUI-FG", "QUI", "QUI-FG-1", 3, 7, "E-QUI"),
      ...items("CL-PS", "CL", "CL-PS-ID", 1, 3, "E-CL"),
    ],
    tax,
  );
  const sub = (id: string) => r.subareas.find((s) => s.id === id)!;

  it("calcula dominio, nivel y prioridad por subárea", () => {
    expect(sub("PRE-AF").dominio).toBeCloseTo(0.556, 3);
    expect(sub("PRE-AF").nivel).toBe("En desarrollo");
    expect(sub("PRE-AF").prioridad).toBeCloseTo(8.0, 1);
    expect(sub("QUI-FG").dominio).toBeCloseTo(0.429, 3);
    expect(sub("QUI-FG").nivel).toBe("Área de oportunidad");
    expect(sub("QUI-FG").prioridad).toBeCloseTo(8.0, 1);
    expect(sub("CL-PS").dominio).toBeCloseTo(0.333, 3);
    expect(sub("CL-PS").prioridad).toBeCloseTo(4.0, 1);
  });

  it("rompe el empate en 8.0 por peso: Anatomía primero", () => {
    expect(r.prioridades.map((p) => p.id)).toEqual(["PRE-AF", "QUI-FG", "CL-PS"]);
  });

  it("marca datos insuficientes con menos de 3 presentados", () => {
    expect(sub("CL-EST").dominio).toBeNull();
    expect(sub("CL-EST").nivel).toBeNull();
  });

  it("calcula global ponderada y cobertura", () => {
    // (0.5556*18 + 0.4286*14 + 0.3333*6) / 38
    expect(r.global).toBeCloseTo(((5 / 9) * 18 + (3 / 7) * 14 + (1 / 3) * 6) / 38 * 100, 1);
    expect(r.cobertura).toBeCloseTo(38 / 50, 3);
    expect(r.parcial).toBe(true);
  });

  it("reporta errores frecuentes con 2 o más apariciones", () => {
    expect(r.errores.map((e) => e.errorId)).toEqual(["E-PRE", "E-QUI", "E-CL"]);
    expect(r.errores[0].veces).toBe(4);
  });

  it("es determinista", () => {
    const otra = calificar(
      [
        ...items("PRE-AF", "PRE", "PRE-AF-1", 5, 9, "E-PRE"),
        ...items("QUI-FG", "QUI", "QUI-FG-1", 3, 7, "E-QUI"),
        ...items("CL-PS", "CL", "CL-PS-ID", 1, 3, "E-CL"),
      ],
      tax,
    );
    expect(otra).toEqual(r);
  });

  it("arma la descripción personal estable con la semilla", () => {
    const nombres = { subarea: (id: string) => sub(id).nombre, error: () => "Confunde conceptos" };
    const a = describir(r, 42, nombres);
    expect(a).toBe(describir(r, 42, nombres));
    expect(a).toContain("Anatomía y fisiología");
    expect(a).not.toMatch(/ingres|garantiz/i);
  });
});

describe("casos límite", () => {
  it("no reporta un error que aparece una sola vez", () => {
    const r = calificar(items("PRE-AF", "PRE", "PRE-AF-1", 2, 3, "E-UNA"), tax);
    expect(r.errores).toEqual([]);
  });
  it("las no respondidas fallan sin error_id", () => {
    const it0 = items("PRE-AF", "PRE", "PRE-AF-1", 0, 3).map((i) => ({ ...i, errorId: null }));
    const r = calificar(it0, tax);
    expect(r.subareas.find((s) => s.id === "PRE-AF")!.dominio).toBe(0);
    expect(r.errores).toEqual([]);
  });
  it("una subárea en Dominas no entra en prioridades", () => {
    const r = calificar(items("PRE-AF", "PRE", "PRE-AF-1", 5, 5), tax);
    expect(r.prioridades).toEqual([]);
    expect(r.nivel).toBe("Dominas");
  });
  it("sin datos suficientes la global es nula", () => {
    const r = calificar(items("PRE-AF", "PRE", "PRE-AF-1", 1, 2), tax);
    expect(r.global).toBeNull();
    expect(r.cobertura).toBe(0);
  });
  it("compara avance y solo celebra mejoras reales", () => {
    const a = calificar(items("PRE-AF", "PRE", "PRE-AF-1", 2, 6), tax).subareas;
    const b = calificar(items("PRE-AF", "PRE", "PRE-AF-1", 5, 6), tax).subareas;
    const c = compararAvance(a, b).find((x) => x.id === "PRE-AF")!;
    expect(c.diferencia).toBe(50);
    expect(c.mejoraReal).toBe(true);
  });
});

describe("barajado con semilla", () => {
  it("da siempre la misma permutación", () => {
    expect(barajar(["A", "B", "C"], 7)).toEqual(barajar(["A", "B", "C"], 7));
    expect(barajar(["A", "B", "C"], 7).sort()).toEqual(["A", "B", "C"]);
  });
});
