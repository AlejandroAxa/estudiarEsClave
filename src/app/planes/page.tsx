import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { db } from "@/db";
import { sesionActual } from "@/lib/sesion";
import { cotizar, productosActivos } from "@/lib/comercio/comercio";
import { estadoPlan } from "@/lib/planes";
import { formatoFecha, pesos } from "@/lib/fechas";
import { PLANES_AREA, planDeRuta, SKU_BASICO, SKU_MEDICINA } from "@/lib/planes-area";
import { totalCarreras } from "@/lib/areas-generales";
import { PedirFamilia } from "./familia";
import { Brillos, LineaTiempo } from "@/components/estilos/producto";
import { BuscaTuPlan } from "@/components/busca-tu-plan";

export const metadata: Metadata = {
  title: "Planes y precios",
  description:
    "Empieza gratis. Un plan para cada área de la BUAP (Económico Administrativas, Sociales y Humanidades, Naturales y de Salud, Ingenierías y Exactas) y el Paquete Medicina. Un solo pago hasta el día del examen, IVA incluido.",
};

const filas: [string, string, string, string][] = [
  ["Mini diagnóstico", "Sí", "Sí", "Sí"],
  [
    "Diagnóstico completo por secciones",
    "1 en la temporada",
    "Ilimitado",
    "Ilimitado",
  ],
  [
    "Resultado",
    "Global, nivel, descripción y prioridad 1",
    "Completo",
    "Completo",
  ],
  [
    "Revisión pregunta por pregunta",
    "Correcta y explicación",
    "Las 3 argumentaciones y referencias",
    "Igual",
  ],
  ["Práctica por tema", "15 preguntas al día", "Ilimitada", "Ilimitada"],
  [
    "Simulacro cronometrado",
    "1 de muestra (20 min)",
    "1 completo",
    "Ilimitado",
  ],
  ["Repaso espaciado", "Ves cuántos tienes", "Sí", "Sí"],
  ["Puntos, racha, insignias y liga", "Sí", "Sí", "Sí"],
  ["Protección de racha", "1 al mes", "1 por semana", "1 por semana"],
];

export default async function Planes({
  searchParams,
}: {
  searchParams: Promise<{ cupon?: string }>;
}) {
  const { cupon } = await searchParams;
  const ses = await sesionActual();
  const plan = ses ? await estadoPlan(db, ses.cuenta.id) : null;
  const productos = await productosActivos(db);
  const cot = await Promise.all(
    productos.map((p) =>
      cotizar(db, p.sku, {
        cupon,
        referido: ses?.perfil?.llegoConReferido,
        beneficiarioId: ses?.cuenta.id,
      }),
    ),
  );
  const porSku = new Map(productos.map((p, k) => [p.sku, { p, c: cot[k] }]));
  const miRuta = ses?.perfil?.rutaId;

  // Las tarjetas por área, en el orden de las áreas, y Medicina al final.
  const tarjetas = [
    ...PLANES_AREA.flatMap((pa) => {
      const x = porSku.get(pa.sku);
      if (!x) return [];
      return [
        {
          ...x,
          acento: pa.area.acento,
          ojo: `Área ${pa.area.corto}`,
          paraQuien: `${totalCarreras(pa.area)} carreras de la BUAP`,
          incluye: ["Comprensión lectora, Redacción indirecta, Pensamiento matemático e Inglés", ...pa.incluye],
          grupos: pa.area.grupos,
          tuya: planDeRuta(miRuta)?.sku === pa.sku,
          area: pa.area.slug,
        },
      ];
    }),
    ...(porSku.get(SKU_MEDICINA)
      ? [
          {
            ...porSku.get(SKU_MEDICINA)!,
            acento: "#3FD0F5",
            ojo: "Medicina (EIPM)",
            paraQuien: "Médico Cirujano",
            incluye: ["Comprensión lectora, Redacción indirecta y Pensamiento matemático", "Biología, Química y Premedicina", "Simulacros completos de la EIPM"],
            grupos: [],
            tuya: miRuta === "medicina",
            area: "medicina",
          },
        ]
      : []),
  ];
  const basico = porSku.get(SKU_BASICO);
  const otros = productos.filter((p) => p.sku !== SKU_BASICO && !tarjetas.some((t) => t.p.sku === p.sku));
  const buscables = [
    ...PLANES_AREA.filter((pa) => porSku.has(pa.sku)).flatMap((pa) =>
      pa.area.grupos.flatMap((g) => g.carreras.map((carrera) => ({ carrera, plan: porSku.get(pa.sku)!.p.nombre, sku: pa.sku, area: pa.area.nombre }))),
    ),
    ...(porSku.get(SKU_MEDICINA) ? [{ carrera: "Medicina (Médico Cirujano)", plan: porSku.get(SKU_MEDICINA)!.p.nombre, sku: SKU_MEDICINA, area: "Evaluación de Ingreso al Programa de Medicina" }] : []),
  ].sort((a, b) => a.carrera.localeCompare(b.carrera, "es"));

  const boton = (sku: string, nombre: string) =>
    plan?.productos.includes(sku) ? (
      <span className="pastilla">Ya lo tienes</span>
    ) : ses?.perfil ? (
      <Link href={`/comprar/${sku}${cupon ? `?cupon=${encodeURIComponent(cupon)}` : ""}`} className="btn">
        Comprar {nombre}
      </Link>
    ) : (
      <Link href={`/entrar?siguiente=/comprar/${sku}`} className="btn">
        Crear cuenta y comprar
      </Link>
    );

  const precio = (c: (typeof cot)[number]) => (
    <>
      <p className="cifra plan-precio">
        {pesos(c.total)}
        {c.descuento && <span className="small tachado">{pesos(c.precioLista)}</span>}
      </p>
      {c.descuento && <p className="small">{c.descuento.etiqueta}</p>}
      {c.porDia != null && (
        <p className="xs">
          Unos {pesos(c.porDia)} al día hasta el examen ({c.diasAlExamen} días).
        </p>
      )}
    </>
  );

  return (
    <div className="producto">
      <Brillos />
      <div className="wrap band pila">
        <span className="kp-chip">
          <i aria-hidden /> Precios publicados
        </span>
        <h1 className="kp-h1">
          Un plan para tu área, <span className="kp-grad">un pago hasta el examen.</span>
        </h1>
        <p className="lead">
          Cada área de la BUAP presenta un examen distinto, así que cada una tiene su plan: pagas solo por las preguntas de tu examen. Precio final con IVA
          incluido, sin renovaciones automáticas. Paga con tarjeta, en OXXO o por SPEI.
        </p>
        <LineaTiempo
          pasos={[
            ["Hoy", "Eliges el plan de tu área"],
            ["Al confirmarse", "Se abre todo tu examen"],
            ["Día del examen", "Termina, sin renovaciones"],
          ]}
        />
        {cot[0]?.descuento?.tipo === "promocion" && (
          <p className="aviso ok">
            {cot[0].descuento.etiqueta}: vale del {formatoFecha(cot[0].promocionDesde!)} al {formatoFecha(cot[0].fechaExamen!)}, día del examen.
          </p>
        )}

        {buscables.length > 0 && (
          <section className="hoja pila" aria-labelledby="cual">
            <h2 id="cual" style={{ fontSize: 26 }}>
              ¿Cuál es mi plan?
            </h2>
            <p className="small">Escribe la carrera que quieres estudiar y te decimos qué plan le toca. Todas las carreras de un área presentan el mismo examen.</p>
            <BuscaTuPlan carreras={buscables} />
          </section>
        )}

        <div className="planes-area">
          {tarjetas.map(({ p, c, acento, ojo, paraQuien, incluye, grupos, tuya }) => (
            <article
              key={p.sku}
              id={p.sku}
              className={`hoja pila plan-area ${tuya ? "kp-destacada" : ""}`}
              style={{ "--acento": acento } as React.CSSProperties}
            >
              <div className="plan-area-cabeza">
                <span className="plan-area-ojo">{ojo}</span>
                {tuya && <span className="pastilla">Tu área</span>}
              </div>
              <h2>{p.nombre}</h2>
              <p className="xs">Para {paraQuien}</p>
              {precio(c)}
              <ul className="plan-incluye">
                {incluye.map((x) => (
                  <li key={x}>
                    <Check size={16} aria-hidden /> {x}
                  </li>
                ))}
                <li>
                  <Check size={16} aria-hidden /> Simulacros, práctica y repaso sin límite
                </li>
              </ul>
              {grupos.length > 0 && (
                <details className="plan-carreras">
                  <summary>Ver las carreras que incluye</summary>
                  {grupos.map((g) => (
                    <div key={g.nombre}>
                      <b>{g.nombre}</b>
                      <p className="xs">{g.carreras.join(", ")}</p>
                    </div>
                  ))}
                </details>
              )}
              <div className="plan-area-pie">{boton(p.sku, p.nombre)}</div>
            </article>
          ))}
        </div>

        <div className="planes-extra">
          <div className="hoja pila">
            <h2 style={{ fontSize: 22 }}>Gratis</h2>
            <p className="cifra plan-precio">$0</p>
            <p className="small">Para siempre: 15 preguntas al día y un diagnóstico por temporada. Al crear tu cuenta tienes 3 días con todo abierto, sin tarjeta.</p>
            {!ses && (
              <Link href="/entrar" className="btn sec">
                Crear cuenta gratis
              </Link>
            )}
            {plan?.plan === "gratis" && <span className="pastilla">Tu plan actual</span>}
          </div>
          {[...(basico ? [basico] : []), ...otros.map((p) => porSku.get(p.sku)!)].map(({ p, c }) => (
            <div key={p.sku} id={p.sku} className="hoja pila">
              <h2 style={{ fontSize: 22 }}>{p.sku === SKU_BASICO ? "¿Solo las áreas comunes?" : p.nombre}</h2>
              {precio(c)}
              <p className="small">
                {p.sku === SKU_BASICO ? <><b>{p.nombre}</b>: </> : null}
                {p.descripcion}
                {p.sku === SKU_BASICO && " No incluye los módulos de tu área."}
              </p>
              {boton(p.sku, p.nombre)}
            </div>
          ))}
        </div>

        <section className="hoja sin-pad">
          <div className="membrete">
            <b>Comparación</b>
            <span>Cualquier plan de área o el Paquete Medicina abre todo tu examen</span>
          </div>
          <div className="desplazable">
            <table className="lab">
              <thead>
                <tr>
                  <th>Función</th>
                  <th>Gratis</th>
                  <th>Prueba de 3 días</th>
                  <th>Plan de tu área</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(([f, ...v]) => (
                  <tr key={f}>
                    <td>{f}</td>
                    {v.map((x, i) => (
                      <td key={i}>
                        {x === "Sí" ? (
                          <Check size={18} aria-label="Sí" color="var(--ok)" />
                        ) : x === "No" ? (
                          <Minus size={18} aria-label="No" />
                        ) : (
                          x
                        )}
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
            <p>
              Creamos un enlace de pago a tu nombre que vence en 7 días. Quien
              lo abra paga sin crear cuenta y el pase queda en tu cuenta.
            </p>
            <PedirFamilia
              productos={productos.map((p, k) => ({
                sku: p.sku,
                nombre: p.nombre,
                total: cot[k].total,
              }))}
              alias={ses.perfil.alias}
            />
          </section>
        )}
        <p className="xs">
          Para comprar hay que ser mayor de edad. Los pagos los procesa la
          pasarela; nunca vemos ni guardamos datos de tarjeta. ¿Dudas?{" "}
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>.
        </p>
      </div>
    </div>
  );
}
