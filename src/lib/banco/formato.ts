/**
 * Formato canónico de un banco (LEEME-formato-banco.md, v1.0.0), con los
 * campos que el modelo pide sumar: validado_por, validado_en, rutas y ruta de
 * la plantilla. Todos opcionales en el JSON para seguir leyendo el banco semilla.
 */
import { z } from "zod";

const id = z.string().min(1).max(60);

export const temaJson = z.object({ id, nombre: z.string().min(1) });
export const subareaJson = z.object({
  id,
  nombre: z.string().min(1),
  reactivos_examen: z.number().int().positive(),
  temas: z.array(temaJson).min(1),
});
export const areaJson = z.object({
  id,
  nombre: z.string().min(1),
  tipo: z.enum(["transversal", "modulo"]),
  cuenta_puntaje: z.boolean(),
  subareas: z.array(subareaJson).min(1),
});
export const errorJson = z.object({
  id,
  area: z.string().nullable().optional(),
  descripcion: z.string().min(1),
  recomendacion: z.string().min(1),
});
export const textoJson = z
  .object({
    id,
    ambito: z.string(),
    tipo_texto: z.string(),
    /** Sin título cuando una pregunta pide elegir el título del texto. */
    titulo: z
      .string()
      .nullable()
      .transform((t) => t ?? ""),
    parrafos: z.array(z.string()).optional(),
    versos: z.array(z.string()).optional(),
    autoria: z.string().nullable().optional(),
  })
  .refine((t) => (t.parrafos?.length ?? 0) + (t.versos?.length ?? 0) > 0, "El texto no tiene párrafos ni versos");

export const opcionJson = z.object({
  id: z.enum(["A", "B", "C"]),
  texto: z.string().min(1),
  correcta: z.boolean(),
  argumentacion: z.string().min(1, "Falta la argumentación"),
  error_id: z.string().nullable(),
});

export const reactivoJson = z.object({
  id,
  version: z.number().int().positive(),
  examen: z.string().optional(),
  rutas: z.array(z.string()).min(1),
  area: z.string(),
  subarea: z.string(),
  tema: z.string(),
  habilidad: z.string(),
  dificultad_estimada: z.number().int().min(1).max(3),
  formato: z.string(),
  texto_id: z.string().nullable(),
  enunciado: z.string().min(1),
  opciones: z.array(opcionJson),
  explicacion: z.string(),
  /** Ficha de datos opcional: [{ tex: "t", desc: "tiempo, en segundos" }]. */
  datos: z.array(z.object({ tex: z.string().min(1).max(80), desc: z.string().min(1).max(200) })).max(8).optional(),
  /** Gráfica opcional para la revisión. La función solo admite números, t o x, + - * / ^ y paréntesis. */
  figura: z
    .object({
      tipo: z.enum(["parabola", "funcion"]),
      f: z.string().regex(/^[0-9tx+\-−*·×/^(). ]{1,80}$/, "La función de la figura solo admite números, t o x, operaciones y paréntesis"),
      dominio: z.tuple([z.number(), z.number()]).refine(([a, b]) => a < b, "El dominio debe ir de menor a mayor"),
      marcar: z.tuple([z.number(), z.number()]).optional(),
      ejes: z.object({ x: z.string().max(30).optional(), y: z.string().max(30).optional() }).optional(),
    })
    .optional(),
  /** Estructura química opcional en SMILES, para la revisión. */
  smiles: z.string().regex(/^[A-Za-z0-9@+\-\[\]()=#$\\/%.:*]{1,200}$/, "SMILES inválido").optional(),
  referencias: z.array(z.object({ fuente: z.string(), ubicacion: z.string() })).default([]),
  tiempo_estimado_seg: z.number().int().positive(),
  estado: z.string(),
  origen: z.enum(["humano", "ia"]).optional(),
  validado_por: z.string().optional(),
  validado_en: z.string().optional(),
  revision: z.unknown().optional(),
});

export const plantillaJson = z.object({
  id,
  nombre: z.string(),
  ruta: z.string().optional(),
  modo: z.enum(["mini", "diagnostico", "simulacro", "muestra"]).optional(),
  reactivos: z.array(z.string()).min(1),
  tiempo_limite_min: z.number().int().positive(),
  ponderacion: z.string().optional(),
  umbrales: z.object({ domina: z.number(), en_desarrollo: z.number() }),
  minimo_reactivos_para_reportar: z.number().int().min(1),
  familia_equivalencia: z.string().optional(),
  notas: z.string().optional(),
});

export const rutaJson = z.object({
  id,
  nombre: z.string(),
  grupos: z.array(z.string()).optional(),
  carrera: z.string().optional(),
});

export const bancoJson = z.object({
  meta: z
    .object({
      nombre: z.string(),
      version: z.string(),
      fecha: z.string().optional(),
      examen: z.string().optional(),
      examen_nombre: z.string().optional(),
      nivel: z.enum(["licenciatura", "prepa"]).optional(),
    })
    .passthrough(),
  rutas: z.array(rutaJson).optional(),
  taxonomia: z.array(areaJson).min(1),
  errores: z.array(errorJson),
  textos: z.array(textoJson).default([]),
  reactivos: z.array(reactivoJson).min(1),
  plantillas: z.array(plantillaJson).default([]),
});

export type BancoJson = z.infer<typeof bancoJson>;
export type ReactivoJson = z.infer<typeof reactivoJson>;

/** Grupos de ruta conocidos: etiquetas que el banco usa para varias carreras. */
export const GRUPOS_RUTA: Record<string, string> = {
  todas: "Todas las rutas del examen",
  salud: "Carreras del área de la salud",
  exactas: "Carreras de ciencias exactas e ingenierías",
  "epiu-general-sociales": "BUAP: módulo general de Ciencias Sociales",
  "epiu-general-experimentales": "BUAP: módulo general de Ciencias Experimentales",
};

/** Rutas conocidas cuando el banco no trae su lista. */
export const RUTAS_CONOCIDAS: Record<string, { nombre: string; grupos: string[]; carrera: string }> = {
  medicina: { nombre: "Medicina", grupos: ["salud", "todas"], carrera: "Médico Cirujano" },
  enfermeria: { nombre: "Enfermería", grupos: ["salud", "todas"], carrera: "Enfermería" },
  estomatologia: { nombre: "Estomatología", grupos: ["salud", "todas"], carrera: "Cirujano Dentista" },
  nutricion: { nombre: "Nutrición", grupos: ["salud", "todas"], carrera: "Nutrición Clínica" },
  fisioterapia: { nombre: "Fisioterapia", grupos: ["salud", "todas"], carrera: "Fisioterapia" },
  psicologia: { nombre: "Psicología", grupos: ["todas"], carrera: "Psicología" },
  prepa: { nombre: "Preparatoria", grupos: ["todas"], carrera: "Bachillerato" },
};
