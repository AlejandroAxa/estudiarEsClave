/**
 * Testimonios de aspirantes que usaron el simulador y entraron a la BUAP.
 * Solo datos reales que nos dieron ellos mismos, con su permiso para publicar
 * la foto. `frase` queda vacía hasta tener sus palabras textuales: no se
 * inventan citas. `nombre` vacío muestra "Entró a <carrera> en la BUAP".
 */
export type Testimonio = {
  nombre: string;
  carrera: string;
  puntos: number;
  foto: string;
  alt: string;
  frase?: string;
};

export const TESTIMONIOS: Testimonio[] = [
  {
    nombre: "",
    carrera: "Medicina",
    puntos: 899,
    foto: "/imagenes/testimonio-medicina.webp",
    alt: "Estudiante sonriendo con audífonos al cuello y una laptop, sentado bajo un árbol",
  },
  {
    nombre: "",
    carrera: "Psicología",
    puntos: 912,
    foto: "/imagenes/testimonio-psicologia.webp",
    alt: "Retrato de cerca de una estudiante",
  },
  {
    nombre: "",
    carrera: "Derecho",
    puntos: 800,
    foto: "/imagenes/testimonio-derecho.webp",
    alt: "Estudiante con suéter de rayas tomándose una foto en el espejo",
  },
  {
    nombre: "",
    carrera: "Administración",
    puntos: 971,
    foto: "/imagenes/testimonio-administracion.webp",
    alt: "Estudiante con lentes y mochila azul tomándose una foto en el espejo",
  },
];
