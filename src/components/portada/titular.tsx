/**
 * Titular de la portada: palabras enormes en Anybody condensada que suben letra
 * por letra con un giro leve, como piezas que caen en su lugar. Solo CSS; con
 * movimiento reducido aparecen quietas.
 */
const giro = (i: number) => ((i * 37) % 11) - 5; // grados, entre -5 y 5, siempre igual en servidor y cliente

export function Titular({ lineas, etiqueta }: { lineas: string[]; etiqueta: string }) {
  let n = 0;
  return (
    <h1 className="titular" aria-label={etiqueta}>
      {lineas.map((linea, l) => (
        <span key={l} className="titular-linea" aria-hidden>
          {linea.split(" ").map((palabra, p) => (
            <span key={p} className="titular-palabra">
              {[...palabra].map((letra, k) => {
                const i = n++;
                return (
                  <span key={k} className="titular-letra" style={{ "--i": i, "--giro": `${giro(i)}deg` } as React.CSSProperties}>
                    {letra}
                  </span>
                );
              })}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
