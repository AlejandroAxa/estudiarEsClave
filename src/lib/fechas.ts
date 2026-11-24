/** Fechas en hora del centro de México (America/Mexico_City), que es la que cuenta para rachas y cuotas. */
export const ZONA = "America/Mexico_City";

/** AAAA-MM-DD del día en CDMX para un instante. */
export function diaMx(fecha: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
}

/** Diferencia horaria (minutos) de CDMX respecto a UTC en ese instante. */
function desfaseMin(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: ZONA, timeZoneName: "longOffset" }).formatToParts(fecha);
  const tz = partes.find((p) => p.type === "timeZoneName")?.value ?? "GMT-06:00";
  const m = tz.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return -360;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Instante UTC en que empieza (00:00 CDMX) el día AAAA-MM-DD. */
export function inicioDiaMx(dia: string): Date {
  const aprox = new Date(`${dia}T12:00:00Z`);
  const off = desfaseMin(aprox);
  return new Date(Date.parse(`${dia}T00:00:00Z`) - off * 60000);
}

export function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

/** Lunes de la semana del día dado. */
export function lunesDe(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return sumarDias(dia, -dow);
}

export function primeroDeMes(dia: string): string {
  return dia.slice(0, 8) + "01";
}

export function formatoFecha(dia: string | Date, opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  const d = typeof dia === "string" ? new Date(`${dia}T12:00:00Z`) : dia;
  return new Intl.DateTimeFormat("es-MX", { timeZone: typeof dia === "string" ? "UTC" : ZONA, ...opciones }).format(d);
}

export function formatoHora(d: Date) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "numeric", minute: "2-digit" }).format(d);
}

export function pesos(n: number | string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: Number(n) % 1 ? 2 : 0 }).format(Number(n));
}
