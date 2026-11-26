"use client";
import { useActionState, useState } from "react";
import { crearPedidoFamilia } from "@/app/acciones/compra";

export function PedirFamilia({ productos, alias, inicial }: { productos: { sku: string; nombre: string; total: number }[]; alias: string; inicial?: string }) {
  const [estado, accion, enviando] = useActionState(crearPedidoFamilia, undefined);
  const [sku, setSku] = useState(inicial ?? productos[productos.length - 1]?.sku);
  const [copiado, setCopiado] = useState(false);
  const prod = productos.find((p) => p.sku === sku);
  const mensaje = estado?.url
    ? `Hola, estoy preparándome para el examen de admisión con Estudiar es Clave. ¿Me ayudas a pagar el ${prod?.nombre} ($${prod?.total})? Puedes pagar con tarjeta, OXXO o transferencia aquí: ${estado.url}`
    : "";
  if (estado?.url)
    return (
      <div className="pila">
        <p className="aviso ok">Listo. El enlace vence en 7 días y sirve para un solo pago.</p>
        <div className="fila">
          <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer">
            Mandar por WhatsApp
          </a>
          <a className="btn sec" href={`mailto:?subject=${encodeURIComponent("¿Me ayudas con mi pase de estudio?")}&body=${encodeURIComponent(mensaje)}`}>
            Mandar por correo
          </a>
          <button
            className="btn disc"
            onClick={async () => {
              if (navigator.share) await navigator.share({ text: mensaje }).catch(() => {});
              else {
                await navigator.clipboard.writeText(estado.url!);
                setCopiado(true);
              }
            }}
          >
            {copiado ? "Enlace copiado" : "Copiar o compartir"}
          </button>
        </div>
        <p className="xs">El enlace solo muestra tu alias ({alias}) y el producto. Nunca tus respuestas ni tu correo.</p>
      </div>
    );
  return (
    <form action={accion} className="fila">
      <select name="sku" value={sku} onChange={(e) => setSku(e.target.value)} style={{ maxWidth: 320 }} aria-label="Producto">
        {productos.map((p) => (
          <option key={p.sku} value={p.sku}>
            {p.nombre} · ${p.total}
          </option>
        ))}
      </select>
      <input type="hidden" name="canal" value="whatsapp" />
      <button className="btn" disabled={enviando}>
        Crear enlace de pago
      </button>
      {estado?.error && <p className="aviso error">{estado.error}</p>}
    </form>
  );
}
