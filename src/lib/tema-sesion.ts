import "server-only";
import { sesionActual } from "./sesion";
import { temaDeRuta } from "./tema-area";

/** Tema del alumno con sesión; sin sesión o sin perfil (mini diagnóstico anónimo) se queda con el diseño original. */
export async function temaActual() {
  const ses = await sesionActual().catch(() => null);
  return temaDeRuta(ses?.perfil?.rutaId);
}
