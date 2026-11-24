/**
 * MFA del administrador (RNF-10): TOTP de 6 dígitos (RFC 6238) con el secreto
 * ADMIN_TOTP_SECRET en base32. Se agrega con cualquier app de autenticación.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function base32(s: string) {
  const alf = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of s.replace(/=+$/, "").replace(/\s/g, "").toUpperCase()) {
    const v = alf.indexOf(c);
    if (v < 0) throw new Error("ADMIN_TOTP_SECRET no es base32");
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function codigoTotp(secreto: string, t = Date.now(), paso = 30) {
  const contador = Math.floor(t / 1000 / paso);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(contador));
  const h = createHmac("sha1", base32(secreto)).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

export function verificarTotp(codigo: string, secreto = process.env.ADMIN_TOTP_SECRET) {
  if (!secreto || !/^\d{6}$/.test(codigo)) return false;
  const ahora = Date.now();
  return [-1, 0, 1].some((d) => {
    const a = Buffer.from(codigoTotp(secreto, ahora + d * 30000));
    return timingSafeEqual(a, Buffer.from(codigo));
  });
}

const llave = () => process.env.BETTER_AUTH_SECRET ?? "desarrollo";
export function sellarMfa(sesionId: string, horas = 12) {
  const hasta = Date.now() + horas * 3600000;
  const firma = createHmac("sha256", llave()).update(`${sesionId}.${hasta}`).digest("base64url");
  return `${hasta}.${firma}`;
}
export function mfaValida(sesionId: string, sello: string | undefined) {
  if (!sello) return false;
  const [hasta, firma] = sello.split(".");
  if (!hasta || !firma || Number(hasta) < Date.now()) return false;
  const esperado = createHmac("sha256", llave()).update(`${sesionId}.${hasta}`).digest("base64url");
  return esperado.length === firma.length && timingSafeEqual(Buffer.from(esperado), Buffer.from(firma));
}
