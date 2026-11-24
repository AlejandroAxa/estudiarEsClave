/** Blíster de dosis diaria: 10 cápsulas que se botan al contestar. */
export function Blister({ tomadas, total = 10 }: { tomadas: number; total?: number }) {
  return (
    <div>
      <div className="blister" role="img" aria-label={`${Math.min(tomadas, total)} de ${total} preguntas de la dosis de hoy`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`capsula ${i < tomadas ? "tomada" : ""}`} />
        ))}
      </div>
    </div>
  );
}
