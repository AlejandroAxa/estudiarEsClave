/**
 * Límites de uso por IP y por cuenta (seguridad, sección 11) con Upstash Redis.
 * Acepta las variables de la integración del Marketplace (KV_REST_API_*) o las
 * de Upstash (UPSTASH_REDIS_REST_*). Sin Redis, usa un contador en memoria.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const reglas = {
  login: { n: 5, ventana: "10 m" },
  respuesta: { n: 120, ventana: "1 m" },
  intento: { n: 20, ventana: "10 m" },
  enlace: { n: 20, ventana: "1 h" },
  general: { n: 300, ventana: "1 m" },
  mfa: { n: 5, ventana: "10 m" },
} as const;
type Regla = keyof typeof reglas;

const limitadores = new Map<Regla, Ratelimit>();
const memoria = new Map<string, { n: number; hasta: number }>();

function enMs(v: string) {
  const [n, u] = v.split(" ");
  return Number(n) * (u === "m" ? 60000 : u === "h" ? 3600000 : 1000);
}

export async function limitar(regla: Regla, clave: string): Promise<{ ok: boolean; reintentarEn?: number }> {
  const r = reglas[regla];
  if (redis) {
    let l = limitadores.get(regla);
    if (!l) {
      l = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(r.n, r.ventana as `${number} m`), prefix: `eec:${regla}` });
      limitadores.set(regla, l);
    }
    const res = await l.limit(clave);
    return { ok: res.success, reintentarEn: res.reset };
  }
  const k = `${regla}:${clave}`;
  const ahora = Date.now();
  const e = memoria.get(k);
  if (!e || e.hasta < ahora) {
    memoria.set(k, { n: 1, hasta: ahora + enMs(r.ventana) });
    return { ok: true };
  }
  e.n++;
  return { ok: e.n <= r.n, reintentarEn: e.hasta };
}

export function ipDe(h: Headers) {
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}
