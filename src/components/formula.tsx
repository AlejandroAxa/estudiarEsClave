/**
 * Componentes de servidor para texto del banco con fórmulas. El HTML sale de
 * src/lib/formulas.ts: el texto se escapa y las fórmulas las compone KaTeX.
 */
import { componer, componerDatos, componerExplicacion } from "@/lib/formulas";
import { figuraSvg, type Figura } from "@/lib/figura";

export function Formula({ texto, className }: { texto: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: componer(texto) }} />;
}

export function Enunciado({ texto, className = "pregunta", id }: { texto: string; className?: string; id?: string }) {
  return <div className={className} id={id} dangerouslySetInnerHTML={{ __html: componer(texto) }} />;
}

export function Explicacion({ texto }: { texto: string }) {
  return <div className="explicacion" dangerouslySetInnerHTML={{ __html: componerExplicacion(texto) }} />;
}

export function FichaDatos({ datos }: { datos: { tex: string; desc: string }[] | null | undefined }) {
  if (!datos?.length) return null;
  return (
    <dl className="ficha" aria-label="Datos">
      {componerDatos(datos).map((d, k) => (
        <div key={k}>
          <dt dangerouslySetInnerHTML={{ __html: d.tex }} />
          <dd dangerouslySetInnerHTML={{ __html: d.desc }} />
        </div>
      ))}
    </dl>
  );
}

/** Gráfica de la revisión. Si la función no se puede dibujar, no muestra nada. */
export function FiguraRevision({ figura }: { figura: Figura | null | undefined }) {
  if (!figura) return null;
  let svg: string;
  try {
    svg = figuraSvg(figura);
  } catch {
    return null;
  }
  return <figure className="figura-revision" dangerouslySetInnerHTML={{ __html: svg }} />;
}
