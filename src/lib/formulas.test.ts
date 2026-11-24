import { describe, expect, it } from "vitest";
import { componer, componerExplicacion, erroresFormula, pasosDe } from "./formulas";
import { analizar, figuraSvg } from "./figura";

describe("componer", () => {
  it("deja igual el texto sin fórmulas, escapado", () => {
    expect(componer("¿Cuál es <b>x</b>?")).toBe("¿Cuál es &lt;b&gt;x&lt;/b&gt;?");
    expect(componer("línea 1\nlínea 2")).toBe("línea 1<br>línea 2");
  });

  it("respeta los pesos de los reactivos viejos", () => {
    expect(componer("Una chamarra cuesta $1,200 y luego $900.")).toBe("Una chamarra cuesta $1,200 y luego $900.");
    expect(componer("Cuesta \\$5")).toBe("Cuesta $5");
  });

  it("compone fórmulas en línea y en bloque con MathML", () => {
    const h = componer("donde $t$ es el tiempo");
    expect(h).toContain('class="katex"');
    expect(h).toContain("<math");
    const b = componer("está dada por\n$$h(t) = -5t^2 + 20t$$\ndonde");
    expect(b).toContain("katex-display");
    expect(b).not.toContain("<br>");
    expect(componer("$20\\ \\text{m}$")).toContain("katex");
    expect(componer("$0.5\\ \\text{M}$")).toContain("katex");
    expect(componer("Cuesta $45.")).toBe("Cuesta $45.");
  });

  it("compone química con mhchem", () => {
    const h = componer("$\\ce{C3H8 + 5O2 -> 3CO2 + 4H2O}$");
    expect(h).toContain("katex");
    expect(erroresFormula("$\\ce{C3H8 + 5O2 -> 3CO2 + 4H2O}$")).toEqual([]);
  });

  it("no deja pasar HTML ni dentro de una fórmula", () => {
    const h = componer("$\\text{<img src=x onerror=alert(1)>}$ <script>alert(1)</script>");
    expect(h).not.toMatch(/<img|<script/);
  });

  it("detecta fórmulas que no compilan", () => {
    expect(erroresFormula("$\\frac{1}{$")).toHaveLength(1);
  });
});

describe("explicación en pasos", () => {
  it("reconoce «1)» y arma una lista", () => {
    expect(pasosDe("1) n = 0.5 mol.\n2) V = 0.5 L.")).toHaveLength(2);
    expect(componerExplicacion("1) uno\n2) dos")).toMatch(/^<ol class="pasos"><li><span>uno<\/span><\/li><li><span>dos<\/span><\/li><\/ol>$/);
    expect(componerExplicacion("Una sola línea.")).toBe("<p>Una sola línea.</p>");
  });
});

describe("figura", () => {
  it("evalúa sin eval y con multiplicación implícita", () => {
    const f = analizar("-5t^2+20t");
    expect(f(2)).toBe(20);
    expect(analizar("2(t+1)")(3)).toBe(8);
    expect(() => analizar("process.exit()")).toThrow();
  });
  it("dibuja un SVG con el punto marcado", () => {
    const svg = figuraSvg({ tipo: "parabola", f: "-5t^2+20t", dominio: [0, 4], marcar: [2, 20], ejes: { x: "t (s)", y: "h (m)" } });
    expect(svg).toContain("<svg");
    expect(svg).toContain("(2, 20)");
  });
});
