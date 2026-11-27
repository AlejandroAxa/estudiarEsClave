/** Metas de las medallas de logro. Sin dependencias para usarlas en el servidor y en el navegador. */
export const LOGROS_ACIERTOS = [20, 50, 100, 250, 500] as const;
export const LOGROS_RACHA = [5, 10, 20, 30, 50] as const;

export type TipoLogro = "aciertos" | "racha";

export function idLogro(tipo: TipoLogro, meta: number) {
  return tipo === "aciertos" ? `aciertos-${meta}` : `racha-aciertos-${meta}`;
}

export function esLogro(insigniaId: string) {
  return /^(aciertos|racha-aciertos)-\d+$/.test(insigniaId);
}
