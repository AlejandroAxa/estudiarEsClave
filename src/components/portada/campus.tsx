import Image from "next/image";

/** Franja de fotos del campus, sin escudo ni logotipos institucionales. */
export function FranjaCampus() {
  return (
    <figure className="joa-franja">
      <Image
        src="/imagenes/campus-estudiantes.webp"
        alt="Estudiantes en el campus: tres revisando apuntes junto a un muro verde, dos en un laboratorio con cubrebocas y una alumna con un lienzo"
        width={1534}
        height={344}
        sizes="100vw"
      />
      <figcaption className="wrap">
        <span className="joa-etiqueta">_tu_lugar</span>
        <span>
          Así se ve el otro lado del examen. Estudiar es Clave es un simulador
          independiente: no está afiliado a la BUAP ni al CENEVAL.
        </span>
      </figcaption>
    </figure>
  );
}
