import "server-only";
import { sesionActual, sesionAnonima } from "./sesion";
import type { Dueno } from "./evaluacion/evaluacion";

/** Quién está haciendo la petición: su cuenta o su sesión anónima (cookie propia). */
export async function duenoActual(): Promise<Dueno & { cuentaId: string | null }> {
  const ses = await sesionActual();
  return { cuentaId: ses?.cuenta.id ?? null, sesionAnonimaId: ses ? null : await sesionAnonima() };
}
