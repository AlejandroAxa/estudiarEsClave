/** Generador pseudoaleatorio con semilla (mulberry32): mismo número, misma secuencia. */
export function generador(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mezcla Fisher-Yates determinista. No modifica el arreglo original. */
export function barajar<T>(lista: readonly T[], semilla: number): T[] {
  const r = generador(semilla);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Combina una semilla con un número (p. ej. el orden del ítem) para derivar otra. */
export function derivar(semilla: number, n: number) {
  return (Math.imul(semilla ^ 0x9e3779b9, 31) + Math.imul(n + 1, 0x85ebca6b)) >>> 0;
}

/** Elige un elemento de forma determinista. */
export function elegir<T>(lista: readonly T[], semilla: number): T {
  return lista[Math.floor(generador(semilla)() * lista.length)];
}

export function semillaNueva() {
  // 31 bits para que quepa sin problemas en bigint y en number.
  return Math.floor(Math.random() * 2 ** 31);
}
