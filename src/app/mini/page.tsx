import type { Metadata } from "next";
import Link from "next/link";
import { OPCIONES_MINI } from "@/lib/areas-generales";
import { deResumen, resumenPlantillas } from "@/lib/consultas";
import { sesionActual } from "@/lib/sesion";
import { BotonMini } from "./boton";
import { Brillos, LineaTiempo, NoTienes } from "@/components/estilos/producto";

export const metadata: Metadata = {
  title: "Mini diagnóstico gratis",
  description:
    "3 preguntas de cada área del EXANI-II de tu área de conocimiento, en 20 minutos y sin crear cuenta.",
};

export default async function Mini({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const { area } = await searchParams;
  const ses = await sesionActual().catch(() => null);
  const resumen = await resumenPlantillas(OPCIONES_MINI.map((o) => o.id)).catch(
    () => [],
  );
  const opciones = OPCIONES_MINI.map((o) => {
    const m = deResumen(resumen, o.id, "mini");
    return {
      id: o.id,
      nombre: o.nombre,
      detalle: m
        ? `${m.preguntas} preguntas · ${m.minutos} min`
        : "Próximamente",
    };
  });
  const porParametro = OPCIONES_MINI.find((o) => o.slug === area)?.id;
  const delPerfil = OPCIONES_MINI.find((o) => o.id === ses?.perfil?.rutaId)?.id;
  const elegida = porParametro ?? delPerfil ?? "";
  return (
    <div className="producto">
      <Brillos />
      <div className="wrap band kp-dos">
        <div className="pila">
          <span className="kp-chip">
            <i aria-hidden /> Gratis · sin cuenta
          </span>
          <h1 className="kp-h1">
            Tu mini diagnóstico, <span className="kp-grad">en 20 minutos.</span>
          </h1>
          <p className="lead">
            Elige el área de tu carrera y te damos 3 preguntas de cada área del
            examen que vas a presentar: las comunes más los módulos de tu área.
            Al final ves cómo vas en cada una.
          </p>
          <NoTienes
            titulo="Lo que no tienes que hacer"
            items={[
              "Crear una cuenta",
              "Dar tu nombre o tu correo",
              "Poner una tarjeta",
            ]}
          />
          <LineaTiempo
            pasos={[
              ["Ahora", "Eliges tu área"],
              ["20 minutos", "Ves cómo vas en cada una"],
            ]}
          />
        </div>
        <div className="kp-tarjeta pila">
          <BotonMini opciones={opciones} elegida={elegida} />
          <ul className="xs kp-notas">
            <li>Puedes marcar preguntas para revisar y moverte entre ellas.</li>
            <li>
              Si se va la señal, tus respuestas se guardan en el teléfono.
            </li>
          </ul>
          <p className="xs">
            ¿No sabes en qué área está tu carrera? Búscala en{" "}
            <Link href="/carreras">Áreas generales</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
