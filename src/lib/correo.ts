export type CorreoLocal = { para: string; asunto: string; texto: string; enlace: string | null; en: Date };

/**
 * Buzón local: con CORREO_LOCAL=1 (solo Docker o desarrollo, nunca en Vercel) los
 * correos simulados también se guardan en memoria y se ven en /entrar/buzon, para
 * poder entrar sin un servicio de correo.
 */
export const buzonLocalActivo = () => process.env.CORREO_LOCAL === "1" && !process.env.VERCEL && !process.env.RESEND_API_KEY;

const g = globalThis as unknown as { __buzonLocal?: CorreoLocal[] };
export function buzonLocal(): CorreoLocal[] {
  return buzonLocalActivo() ? (g.__buzonLocal ?? []) : [];
}

/** Correo transaccional con Resend (RESEND_API_KEY). Sin clave, se escribe en la consola (desarrollo). */
export async function enviarCorreo(p: { para: string; asunto: string; html: string; texto: string }) {
  const clave = process.env.RESEND_API_KEY;
  const de = process.env.CORREO_REMITENTE ?? "Estudiar es Clave <hola@estudiaresclave.mx>";
  if (!clave) {
    console.info(`[correo simulado] Para: ${p.para}\nAsunto: ${p.asunto}\n${p.texto}`);
    if (buzonLocalActivo()) {
      const enlace = p.texto.match(/https?:\/\/\S+/)?.[0] ?? null;
      g.__buzonLocal = [{ para: p.para, asunto: p.asunto, texto: p.texto, enlace, en: new Date() }, ...(g.__buzonLocal ?? [])].slice(0, 20);
    }
    return;
  }
  // Una llave de idempotencia por correo: si un reintento llega dos veces, Resend manda uno solo.
  const llave = crypto.randomUUID();
  const cuerpo = JSON.stringify({ from: de, to: [p.para], subject: p.asunto, html: p.html, text: p.texto });
  for (let intento = 1; ; intento++) {
    let estado = 0;
    let detalle = "";
    let espera = 500 * 2 ** (intento - 1);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json", "Idempotency-Key": llave },
        body: cuerpo,
      });
      if (res.ok) {
        const { id } = (await res.json().catch(() => ({}))) as { id?: string };
        console.info(`[correo] Enviado con Resend (id ${id ?? "?"})`);
        return;
      }
      estado = res.status;
      detalle = await res.text().catch(() => "");
      const reintento = Number(res.headers.get("retry-after"));
      if (reintento > 0) espera = Math.min(reintento * 1000, 10_000);
    } catch (e) {
      detalle = e instanceof Error ? e.message : String(e); // error de red
    }
    // Solo se reintenta lo pasajero: red, 429 y 5xx. Un 4xx (clave o remitente mal) no se arregla solo.
    const pasajero = estado === 0 || estado === 429 || estado >= 500;
    if (!pasajero || intento >= 3) {
      console.error(`[correo] Resend rechazó el envío (${estado || "red"}): ${detalle}`);
      throw new Error(`No se pudo enviar el correo (${estado || "red"})`);
    }
    await new Promise((r) => setTimeout(r, espera));
  }
}

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function plantillaCorreo(titulo: string, parrafo: string, boton: { texto: string; url: string }) {
  const html = `<!doctype html><html lang="es-MX"><body style="margin:0;background:#F2F6F9;font-family:Arial,sans-serif;color:#0F1F2E">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="background:#0B1D2E;color:#D4F1FB;padding:18px 22px;border-radius:6px 6px 0 0;font-weight:900;font-size:20px;letter-spacing:.02em">estudiar es clave</div>
<div style="background:#fff;padding:24px 22px;border-radius:0 0 6px 6px;box-shadow:0 1px 0 #0F1F2E">
<h1 style="font-size:22px;margin:0 0 12px">${escapar(titulo)}</h1>
<p style="font-size:16px;line-height:1.55;margin:0 0 20px">${escapar(parrafo)}</p>
<a href="${escapar(boton.url)}" style="display:inline-block;background:#1F5BC4;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:14px">${escapar(boton.texto)}</a>
<p style="font-size:13px;color:#556066;margin:24px 0 0">Si no pediste este correo, ignóralo. Nadie puede entrar a tu cuenta sin este enlace.</p>
</div></div></body></html>`;
  return { html, texto: `${titulo}\n\n${parrafo}\n\n${boton.texto}: ${boton.url}` };
}
