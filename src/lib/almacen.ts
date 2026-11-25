/**
 * Archivos en disco para el VPS (ALMACEN_DIR, un volumen de Docker). Hoy solo
 * guarda las gráficas de avance ya dibujadas, para no volver a dibujarlas en cada
 * visita. Sin ALMACEN_DIR no hace nada y la gráfica se dibuja al vuelo.
 */
import "server-only";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const raiz = () => process.env.ALMACEN_DIR || null;

function ruta(nombre: string) {
  const r = raiz();
  if (!r || !/^[\w-]+\/[\w.-]+$/.test(nombre)) return null;
  return path.join(r, nombre);
}

export async function leerArchivo(nombre: string) {
  const p = ruta(nombre);
  if (!p) return null;
  return readFile(p).catch(() => null);
}

export async function guardarArchivo(nombre: string, datos: Buffer) {
  const p = ruta(nombre);
  if (!p) return;
  try {
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, datos);
  } catch (e) {
    console.error("almacen_fallo", (e as Error).message);
  }
}

/** Borra los archivos de una carpeta con más de `dias` días. Devuelve cuántos borró. */
export async function borrarViejos(carpeta: string, dias: number) {
  const r = raiz();
  if (!r || !/^[\w-]+$/.test(carpeta)) return 0;
  const dir = path.join(r, carpeta);
  const limite = Date.now() - dias * 86400000;
  let n = 0;
  for (const f of await readdir(dir).catch(() => [] as string[])) {
    const p = path.join(dir, f);
    const st = await stat(p).catch(() => null);
    if (st?.isFile() && st.mtimeMs < limite) {
      await rm(p, { force: true });
      n++;
    }
  }
  return n;
}
