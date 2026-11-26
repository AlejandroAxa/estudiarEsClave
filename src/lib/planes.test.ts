import { describe, expect, it } from "vitest";
import { paseCubre, planParaArea, planParaRuta, type EstadoPlan } from "./planes";
import { AREAS_COMUNES, PLANES_AREA, planDeRuta } from "./planes-area";
import { AREAS_GENERALES } from "./areas-generales";

const base: EstadoPlan = { plan: "pase", areas: null, pruebaHasta: null, paseHasta: null, productos: [], rutas: [], pruebaUsada: true };
const derecho = planDeRuta("epiu-economico-administrativas")!;
const conPlanDerecho: EstadoPlan = { ...base, areas: [...AREAS_COMUNES, ...derecho.modulos], productos: [derecho.sku], rutas: [derecho.rutaId] };

describe("planes por área", () => {
  it("hay un plan por cada área general, con sku válido", () => {
    expect(PLANES_AREA.map((p) => p.rutaId).sort()).toEqual(AREAS_GENERALES.map((a) => a.rutaId).sort());
    for (const p of PLANES_AREA) expect(p.sku.length).toBeLessThanOrEqual(40);
  });

  it("el plan de Económico Administrativas no abre Química", () => {
    expect(paseCubre(conPlanDerecho, "CEA")).toBe(true);
    expect(paseCubre(conPlanDerecho, "CL")).toBe(true);
    expect(paseCubre(conPlanDerecho, "QUI")).toBe(false);
    expect(planParaArea(conPlanDerecho, "QUI")).toBe("gratis");
  });

  it("los exámenes completos solo cuentan como pase en la ruta del plan", () => {
    expect(planParaRuta(conPlanDerecho, "epiu-economico-administrativas")).toBe("pase");
    expect(planParaRuta(conPlanDerecho, "epiu-naturales-salud")).toBe("gratis");
    const conPrueba = { ...conPlanDerecho, pruebaHasta: new Date(Date.now() + 86400000) };
    expect(planParaRuta(conPrueba, "epiu-naturales-salud")).toBe("prueba");
  });

  it("el plan de Sociales también sirve con la ruta de Psicología", () => {
    const soc = planDeRuta("psicologia")!;
    expect(soc.rutaId).toBe("epiu-sociales-humanidades");
    const e: EstadoPlan = { ...base, areas: [...AREAS_COMUNES, ...soc.modulos], productos: [soc.sku], rutas: [soc.rutaId] };
    expect(planParaRuta(e, "psicologia")).toBe("pase");
    expect(paseCubre(e, "PSI")).toBe(true);
  });

  it("el Pase Básico, sin ruta, sirve en cualquiera", () => {
    const basico: EstadoPlan = { ...base, areas: ["CL", "RI", "PM"], productos: ["pase-basico-2027"], rutas: [null] };
    expect(planParaRuta(basico, "epiu-ingenierias-exactas")).toBe("pase");
  });
});
