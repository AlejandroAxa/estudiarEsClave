import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { accesosVigentes } from "@/lib/planes";
import { ordenesDe } from "@/lib/comercio/comercio";
import { formatoFecha, pesos } from "@/lib/fechas";
import { salir } from "@/app/acciones/cuenta";
import { FormularioBorrar, FormularioCuenta } from "./formularios";
import { Download, LogOut, ShieldCheck, SlidersHorizontal, Ticket } from "lucide-react";
import { CabeceraApp } from "@/components/cabecera-app";
import { temaDeRuta } from "@/lib/tema-area";

export const metadata: Metadata = { title: "Tu cuenta" };

const ESTADO_ORDEN: Record<string, string> = { pendiente: "Pendiente de pago", pagada: "Pagada", expirada: "Expirada", reembolsada: "Reembolsada" };

export default async function Cuenta() {
  const ses = await requerirAlumno("/cuenta");
  const [resumen] = await db
    .select()
    .from(s.preferenciaContacto)
    .where(and(eq(s.preferenciaContacto.cuentaId, ses.cuenta.id), eq(s.preferenciaContacto.canal, "correo"), eq(s.preferenciaContacto.tipo, "resumen_semanal")));
  const accesos = await accesosVigentes(db, ses.cuenta.id);
  const ordenes = await ordenesDe(db, ses.cuenta.id);

  const tema = temaDeRuta(ses.perfil.rutaId);

  return (
    <>
      <CabeceraApp
        tema={tema.tema}
        acento={tema.acento}
        ceja={`@${ses.perfil.alias}`}
        titulo="Tu cuenta"
        sub={
          <>
            Entraste como <b>{ses.cuenta.email}</b>. Tu correo nunca se muestra en la liga ni en lo que compartes.
          </>
        }
        acciones={
          <form action={salir}>
            <button className="btn sec chico">
              <LogOut size={16} aria-hidden /> Cerrar sesión
            </button>
          </form>
        }
      />
      <div className="wrap app-cuerpo">
        <div className="app-rejilla" style={{ alignItems: "start" }}>
          <section className="tarjeta c-7" aria-labelledby="pref">
            <div className="tarjeta-cabeza">
              <span className="icono-chip">
                <SlidersHorizontal size={20} aria-hidden />
              </span>
              <h2 id="pref">Preferencias</h2>
            </div>
            <FormularioCuenta
              v={{
                alias: ses.perfil.alias,
                nombre: ses.cuenta.name,
                tema: ses.perfil.temaInterfaz,
                ranking: ses.perfil.visibleEnRanking,
                repaso: ses.perfil.repasoEspaciado,
                resumen: resumen?.activo ?? false,
              }}
            />
          </section>

          <div className="c-5 pila-app">
            <section className="tarjeta" aria-labelledby="plan">
              <div className="tarjeta-cabeza">
                <span className="icono-chip">
                  <Ticket size={20} aria-hidden />
                </span>
                <h2 id="plan">Tu plan</h2>
              </div>
              {accesos.length === 0 ? (
                <>
                  <p>Estás en el plan gratis.</p>
                  <div className="pie-tarjeta">
                    <Link href="/planes" className="btn chico">
                      Ver los pases
                    </Link>
                  </div>
                </>
              ) : (
                <ul className="lista-plan">
                  {accesos.map(({ acceso, producto }) => (
                    <li key={acceso.id}>
                      <b>{acceso.origen === "prueba" ? "Prueba de 3 días" : (producto?.nombre ?? "Pase")}</b>
                      <span className="small">Vigente hasta el {formatoFecha(acceso.hasta)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {ordenes.length > 0 && (
                <div className="desplazable">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th className="num">Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenes.map(({ orden, producto }) => (
                        <tr key={orden.id}>
                          <td>{formatoFecha(orden.creadaEn, { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td>{producto}</td>
                          <td className="num">{pesos(Number(orden.total))}</td>
                          <td>{ESTADO_ORDEN[orden.estado] ?? orden.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="xs">¿Algo salió mal con un pago? Escríbenos desde tu correo registrado.</p>
            </section>

            <section className="tarjeta" aria-labelledby="datos">
              <div className="tarjeta-cabeza">
                <span className="icono-chip">
                  <ShieldCheck size={20} aria-hidden />
                </span>
                <h2 id="datos">Tus datos</h2>
              </div>
              <p className="small">Descarga todo lo que guardamos de ti, en un archivo que se abre con cualquier editor de texto.</p>
              <div className="pie-tarjeta">
                <a className="btn sec chico" href="/cuenta/datos" download>
                  <Download size={16} aria-hidden /> Descargar mis datos
                </a>
              </div>
              <details className="zona-peligro">
                <summary>Borrar mi cuenta</summary>
                <div className="pila" style={{ marginTop: 12 }}>
                  <p className="small">
                    Se borran tu perfil, tus puntos, tus enlaces y tu acceso. Tus respuestas quedan sin nombre para medir la dificultad de las preguntas.
                    Los comprobantes de pago se conservan sin tu nombre porque la ley fiscal lo pide. No se puede deshacer.
                  </p>
                  <FormularioBorrar />
                </div>
              </details>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
