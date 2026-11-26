/**
 * Piezas del estilo «producto» (referencia: kapedev.com.py): fondo casi negro
 * con brillos de color, titular en sans seminegrita con una frase en
 * degradado, una línea de tiempo corta y la lista de lo que no tienes que
 * hacer. Se usa en Planes, Temarios, Mini diagnóstico y Entrar.
 */
import { Check, X } from "lucide-react";

export function Brillos() {
  return (
    <div className="kp-brillos" aria-hidden>
      <i />
      <i />
    </div>
  );
}

export function LineaTiempo({ pasos }: { pasos: [string, string][] }) {
  return (
    <ol className="kp-linea">
      {pasos.map(([cuando, que]) => (
        <li key={cuando}>
          <span className="kp-mono">{cuando}</span>
          <b>{que}</b>
        </li>
      ))}
    </ol>
  );
}

export function NoTienes({
  titulo,
  items,
}: {
  titulo: string;
  items: string[];
}) {
  return (
    <div className="kp-no">
      <span className="kp-mono">{titulo}</span>
      <ul>
        {items.map((t) => (
          <li key={t}>
            <X size={16} strokeWidth={2.25} aria-hidden />
            <s>{t}</s>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Incluye({ items }: { items: string[] }) {
  return (
    <ul className="kp-si">
      {items.map((t) => (
        <li key={t}>
          <Check size={16} strokeWidth={2.5} aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  );
}
