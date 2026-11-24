"use client";
/** Estructura química dibujada desde SMILES. Solo en la revisión, nunca durante el examen. */
import { useEffect, useRef, useState } from "react";

export function Estructura({ smiles, nombre }: { smiles: string; nombre: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [fallo, setFallo] = useState(false);
  useEffect(() => {
    let vivo = true;
    import("smiles-drawer").then((m) => {
      const SD = (m as unknown as { default?: typeof m }).default ?? m;
      const oscuro = document.documentElement.dataset.tema === "oscuro";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dibujante = new (SD as any).SvgDrawer({ width: 360, height: 200, bondThickness: 1.4, fontSizeLarge: 12, fontSizeSmall: 8, padding: 16, compactDrawing: false, terminalCarbons: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SD as any).parse(
        smiles,
        (arbol: unknown) => vivo && ref.current && dibujante.draw(arbol, ref.current, oscuro ? "dark" : "light"),
        () => vivo && setFallo(true),
      );
    });
    return () => {
      vivo = false;
    };
  }, [smiles]);
  if (fallo) return null;
  return (
    <figure className="estructura">
      <svg ref={ref} role="img" aria-label={`Estructura de ${nombre}`} />
      <figcaption className="xs">Estructura de {nombre}</figcaption>
    </figure>
  );
}
