import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { db } from "@/db";
import { sesionActual } from "@/lib/sesion";
import { cotizar, productosActivos } from "@/lib/comercio/comercio";
import { estadoPlan } from "@/lib/planes";
import { formatoFecha, pesos } from "@/lib/fechas";
import { PedirFamilia } from "./familia";

export const metadata: Metadata = {
  title: "Planes y precios",
  description: "Empieza gratis. Pase Básico $299 o Paquete Medicina $599, un solo pago hasta el día del examen, IVA incluido. Tarjeta, OXXO o SPEI.",
};

const filas: [string, string, string, string][] = [
  ["Mini diagnóstico", "Sí", "Sí", "Sí"],
  ["Diagnóstico completo por secciones", "1 en la temporada", "Ilimitado", "Ilimitado"],
  ["Resultado", "Global, nivel, descripción y prioridad 1", "Completo", "Completo"],
  ["Revisión pregunta por pregunta", "Correcta y explicación", "Las 3 argumentaciones y referencias", "Igual"],
  ["Práctica por tema", "15 preguntas al día", "Ilimitada", "Ilimitada"],
  ["Simulacro cronometrado", "1 de muestra (20 min)", "1 completo", "Ilimitado"],
  ["Repaso espaciado", "Ves cuántos tienes", "Sí", "Sí"],
  ["Puntos, racha, insignias y liga", "Sí", "Sí", "Sí"],
  ["Protección de racha", "1 al mes", "1 por semana", "1 por semana"],
];

export default async function Planes({ searchParams }: { searchParams: Promise<{ cupon?: string }> }) {
  const { cupon } = await searchParams;
  const ses = await sesionActual();
  const plan = ses ? await estadoPlan(db, ses.cuenta.id) : null;
  const productos = await productosActivos(db);
  const cot = await Promise.all(productos.map((p) => cotizar(db, p.sku, { cupon, referido: ses?.perfil?.llegoConReferido, beneficiarioId: ses?.cuenta.id })));

  return (
    <div className="wrap band pila">
      <h1 style={{ fontSize: "clamp(34px,6vw,64px)" }}>Un pago, hasta el examen</h1>
      <p className="lead">Precio final con IVA incluido. Sin renovaciones automáticas ni cargos ocultos. Paga con tarjeta, en OXXO o por SPEI.</p>
      {cot[0]?.descuento?.tipo === "promocion" && (
        <p className="aviso ok">
          {cot[0].descuento.etiqueta}: vale del {formatoFecha(cot[0].promocionDesde!)} al {formatoFecha(cot[0].fechaExamen!)}, día del examen.
        </p>
      )}
      <div className="rejilla">
        <div className="hoja pila">
          <h2 style={{ fontSize: 26 }}>Gratis</h2>
          <p className="cifra" style={{ fontSize: 40, margin: 0 }}>
            $0
          </p>
          <p className="small">Para siempre. Al crear tu cuenta tienes 3 días del pase completo, sin tarjeta.</p>
          {!ses && (
            <Link href="/entrar" className="btn sec">
              Crear cuenta gratis
            </Link>
          )}
          {plan?.plan === "gratis" && <span className="pastilla">Tu plan actual</span>}
        </div>
        {productos.map((p, k) => {
          const c = cot[k];
          return (
            <div key={p.sku} className="hoja pila" style={p.tipo === "paquete" ? { boxShadow: "0 0 0 2px var(--azul), var(--sheet)" } : undefined}>
              {p.tipo === "paquete" && <span className="pastilla">Para Medicina</span>}
              <h2 style={{ fontSize: 26 }}>{p.nombre}</h2>
              <p className="cifra" style={{ fontSize: 40, margin: 0 }}>
                {pesos(c.total)}
                {c.descuento && (
                  <span className="small" style={{ textDecoration: "line-through", marginLeft: 8 }}>
                    {pesos(c.precioLista)}
                  </span>
                )}
              </p>
              {c.descuento && <p className="small">{c.descuento.etiqueta}</p>}
              {c.porDia != null && (
                <p className="small">
                  Unos {pesos(c.porDia)} al día hasta el examen ({c.diasAlExamen} días).
                </p>
              )}
              <p>{p.descripcion}</p>
              {plan?.productos.includes(p.sku) ? (
                <span className="pastilla">Ya lo tienes</span>
              ) : ses?.perfil ? (
                <Link href={`/comprar/${p.sku}${cupon ? `?cupon=${encodeURIComponent(cupon)}` : ""}`} className="btn">
                  Comprar {p.nombre}
                </Link>
              ) : (
                <Link href={`/entrar?siguiente=/comprar/${p.sku}`} className="btn">
                  Crear cuenta y comprar
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <section className="hoja sin-pad">
        <div className="membrete">
          <b>Comparación</b>
          <span>El Pase Básico abre todo en Comprensión lectora, Redacción y Matemáticas</span>
        </div>
        <div className="desplazable">
          <table className="lab">
            <thead>
              <tr>
                <th>Función</th>
                <th>Gratis</th>
                <th>Prueba de 3 días</th>
                <th>Pase</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(([f, ...v]) => (
                <tr key={f}>
                  <td>{f}</td>
                  {v.map((x, i) => (
                    <td key={i}>
                      {x === "Sí" ? <Check size={18} aria-label="Sí" color="var(--ok)" /> : x === "No" ? <Minus size={18} aria-label="No" /> : x}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {ses?.perfil && (
        <section id="familia" className="hoja pila">
          <h2 style={{ fontSize: 26 }}>Pídeselo a tu familia</h2>
          <p>Creamos un enlace de pago a tu nombre que vence en 7 días. Quien lo abra paga sin crear cuenta y el pase queda en tu cuenta.</p>
          <PedirFamilia productos={productos.map((p, k) => ({ sku: p.sku, nombre: p.nombre, total: cot[k].total }))} alias={ses.perfil.alias} />
        </section>
      )}
      <p className="xs">
        Para comprar hay que ser mayor de edad. Los pagos los procesa la pasarela; nunca vemos ni guardamos datos de tarjeta. ¿Dudas? <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>.
      </p>
    </div>
  );
}
