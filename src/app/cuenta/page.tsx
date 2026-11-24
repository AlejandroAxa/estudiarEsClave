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

  return (
    <div className="wrap band pila angosto">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Tu cuenta</h1>
      <p className="small">Entraste como {ses.cuenta.email}. Tu correo nunca se muestra en la liga ni en lo que compartes.</p>

      <section className="hoja pila">
        <h2 style={{ fontSize: 26 }}>Preferencias</h2>
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

      <section className="hoja pila">
        <h2 style={{ fontSize: 26 }}>Tu plan</h2>
        {accesos.length === 0 ? (
          <p>
            Estás en el plan gratuito. <Link href="/planes">Ver pases</Link>
          </p>
        ) : (
          <ul>
            {accesos.map(({ acceso, producto }) => (
              <li key={acceso.id}>
                {acceso.origen === "prueba" ? "Prueba de 3 días" : (producto?.nombre ?? "Pase")}, vigente hasta el {formatoFecha(acceso.hasta)}
              </li>
            ))}
          </ul>
        )}
        {ordenes.length > 0 && (
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
        )}
        <p className="small">
          ¿Algo salió mal con un pago? Escríbenos desde
          tu correo registrado.
        </p>
      </section>

      <section className="hoja pila">
        <h2 style={{ fontSize: 26 }}>Tus datos</h2>
        <p>Puedes descargar todo lo que guardamos de ti, en un archivo que se abre con cualquier editor de texto.</p>
        <a className="btn sec" href="/cuenta/datos" download>
          Descargar mis datos
        </a>
        <details>
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

      <form action={salir}>
        <button className="btn disc">Cerrar sesión</button>
      </form>
    </div>
  );
}
