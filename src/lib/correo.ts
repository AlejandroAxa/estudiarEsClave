/** Correo transaccional con Resend (RESEND_API_KEY). Sin clave, se escribe en la consola (desarrollo). */
export async function enviarCorreo(p: { para: string; asunto: string; html: string; texto: string }) {
  const clave = process.env.RESEND_API_KEY;
  const de = process.env.CORREO_REMITENTE ?? "Estudiar es Clave <hola@estudiaresclave.mx>";
  if (!clave) {
    console.info(`[correo simulado] Para: ${p.para}\nAsunto: ${p.asunto}\n${p.texto}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: de, to: [p.para], subject: p.asunto, html: p.html, text: p.texto }),
  });
  if (!res.ok) throw new Error(`No se pudo enviar el correo (${res.status})`);
}

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function plantillaCorreo(titulo: string, parrafo: string, boton: { texto: string; url: string }) {
  const html = `<!doctype html><html lang="es-MX"><body style="margin:0;background:#F7F3F9;font-family:Arial,sans-serif;color:#1D1724">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="background:#17121C;color:#E9D8EF;padding:18px 22px;border-radius:6px 6px 0 0;font-weight:900;font-size:20px;letter-spacing:.02em">estudiar es clave</div>
<div style="background:#fff;padding:24px 22px;border-radius:0 0 6px 6px;box-shadow:0 1px 0 #1D1724">
<h1 style="font-size:22px;margin:0 0 12px">${escapar(titulo)}</h1>
<p style="font-size:16px;line-height:1.55;margin:0 0 20px">${escapar(parrafo)}</p>
<a href="${escapar(boton.url)}" style="display:inline-block;background:#1F5BC4;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:14px">${escapar(boton.texto)}</a>
<p style="font-size:13px;color:#5E5566;margin:24px 0 0">Si no pediste este correo, ignóralo. Nadie puede entrar a tu cuenta sin este enlace.</p>
</div></div></body></html>`;
  return { html, texto: `${titulo}\n\n${parrafo}\n\n${boton.texto}: ${boton.url}` };
}
