import { describe, expect, it } from "vitest";
import { opcionesSelector, puedeCambiarA, type ReglaCambio } from "./cambio-area";

const rutas = ["epiu-economico-administrativas", "epiu-naturales-salud", "medicina", "psicologia", "exactas-fis"].map((id) => ({ id }));

describe("cambio de área", () => {
  it("con plan de área solo se ofrecen las rutas que cubre", () => {
    const r: ReglaCambio = { permitidas: ["epiu-economico-administrativas"], bloqueadoHasta: null, motivo: "plan" };
    expect(opcionesSelector(rutas, r, "epiu-economico-administrativas").map((x) => x.id)).toEqual(["epiu-economico-administrativas"]);
    expect(puedeCambiarA(r, "medicina", "epiu-economico-administrativas")).toBe(false);
  });
  it("sin plan se puede cambiar una vez y luego hay que esperar", () => {
    const libre: ReglaCambio = { permitidas: null, bloqueadoHasta: null, motivo: null };
    expect(puedeCambiarA(libre, "medicina", "epiu-naturales-salud")).toBe(true);
    const espera: ReglaCambio = { ...libre, bloqueadoHasta: new Date(Date.now() + 86400000), motivo: "espera" };
    expect(puedeCambiarA(espera, "medicina", "epiu-naturales-salud")).toBe(false);
  });
  it("los bancos de apoyo no se ofrecen", () => {
    const libre: ReglaCambio = { permitidas: null, bloqueadoHasta: null, motivo: null };
    expect(opcionesSelector(rutas, libre, "medicina").map((x) => x.id)).not.toContain("exactas-fis");
    expect(puedeCambiarA(libre, "exactas-fis", "medicina")).toBe(false);
  });
});
