import type { Metadata } from "next";
import Link from "next/link";
import { OPCIONES_MINI } from "@/lib/areas-generales";
import { deResumen, resumenPlantillas } from "@/lib/consultas";
import { sesionActual } from "@/lib/sesion";
import { BotonMini } from "./boton";

export const metadata: Metadata = {
  title: "Mini diagnóstico gratis",
  description: "3 preguntas de cada área del EXANI-II de tu área de conocimiento, en 20 minutos y sin crear cuenta.",
};

export default async function Mini({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  const ses = await sesionActual().catch(() => null);
  const resumen = await resumenPlantillas(OPCIONES_MINI.map((o) => o.id)).catch(() => []);
  const opciones = OPCIONES_MINI.map((o) => {
    const m = deResumen(resumen, o.id, "mini");
    return { id: o.id, nombre: o.nombre, detalle: m ? `${m.preguntas} preguntas · ${m.minutos} min` : "Próximamente" };
  });
  const porParametro = OPCIONES_MINI.find((o) => o.slug === area)?.id;
  const delPerfil = OPCIONES_MINI.find((o) => o.id === ses?.perfil?.rutaId)?.id;
  const elegida = porParametro ?? delPerfil ?? "";
  return (
    <div className="angosto band pila">
      <span className="pastilla">Gratis · sin cuenta</span>
      <h1 style={{ fontSize: "clamp(34px,6vw,60px)" }}>Mini diagnóstico</h1>
      <p className="lead">
        Elige el área de tu carrera y te damos 3 preguntas de cada área del examen que vas a presentar: las comunes más los módulos de tu área. Tienes 20
        minutos. Al final ves cómo vas en cada una.
      </p>
      <ul className="small">
        <li>No pedimos ningún dato para empezar.</li>
        <li>Puedes marcar preguntas para revisar y moverte entre ellas.</li>
        <li>Si se va la señal, tus respuestas se guardan en el teléfono.</li>
      </ul>
      <BotonMini opciones={opciones} elegida={elegida} />
      <p className="small">
        ¿No sabes en qué área está tu carrera? Búscala en <Link href="/carreras">Áreas generales</Link>.
      </p>
    </div>
  );
}
