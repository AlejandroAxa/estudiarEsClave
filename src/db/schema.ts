/**
 * Esquema relacional (3FN) del simulador, según la sección 6 del modelo de
 * ingeniería de software. CUENTA es la tabla de usuarios de Better Auth
 * (sus columnas en camelCase son las que pide la librería); el resto son las
 * entidades del dominio. Las reglas de dominio D1 a D25 viven aquí como CHECK
 * cuando son de una sola fila, y en los módulos de lib/ cuando cruzan tablas.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  char,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const creado = () => ts("creado_en").notNull().defaultNow();

/* ───────────────────────── Identidad (Better Auth) ───────────────────────── */

export const cuenta = pgTable(
  "cuenta",
  {
    id: text("id").primaryKey(),
    name: text("nombre_pila").notNull().default(""),
    email: text("correo").notNull(),
    emailVerified: boolean("correo_verificado").notNull().default(false),
    image: text("imagen"),
    estado: varchar("estado", { length: 12 }).notNull().default("activa"),
    avisoVersionAceptada: varchar("aviso_version_aceptada", { length: 16 }),
    createdAt: ts("creado_en").notNull().defaultNow(),
    updatedAt: ts("actualizado_en").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cuenta_correo_uk").on(sql`lower(${t.email})`),
    check("cuenta_estado_ck", sql`${t.estado} in ('activa','suspendida','borrada')`),
  ],
);

export const sesion = pgTable(
  "sesion",
  {
    id: text("id").primaryKey(),
    expiresAt: ts("vence_en").notNull(),
    token: text("token").notNull().unique(),
    createdAt: ts("creado_en").notNull().defaultNow(),
    updatedAt: ts("actualizado_en").notNull().defaultNow(),
    ipAddress: text("ip"),
    userAgent: text("agente"),
    userId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
  },
  (t) => [index("sesion_cuenta_ix").on(t.userId)],
);

export const proveedorCuenta = pgTable(
  "proveedor_cuenta",
  {
    id: text("id").primaryKey(),
    accountId: text("cuenta_externa_id").notNull(),
    providerId: text("proveedor").notNull(),
    userId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ts("access_token_vence"),
    refreshTokenExpiresAt: ts("refresh_token_vence"),
    scope: text("scope"),
    password: text("password"),
    createdAt: ts("creado_en").notNull().defaultNow(),
    updatedAt: ts("actualizado_en").notNull().defaultNow(),
  },
  (t) => [index("proveedor_cuenta_ix").on(t.userId)],
);

export const verificacion = pgTable("verificacion", {
  id: text("id").primaryKey(),
  identifier: text("identificador").notNull(),
  value: text("valor").notNull(),
  expiresAt: ts("vence_en").notNull(),
  createdAt: ts("creado_en").notNull().defaultNow(),
  updatedAt: ts("actualizado_en").notNull().defaultNow(),
});

export const cuentaRol = pgTable(
  "cuenta_rol",
  {
    cuentaId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    rol: varchar("rol", { length: 10 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.cuentaId, t.rol] }), check("cuenta_rol_ck", sql`${t.rol} in ('alumno','admin')`)],
);

/* ───────────────────────── Exámenes y taxonomía ───────────────────────── */

export const examen = pgTable("examen", {
  id: varchar("id", { length: 20 }).primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  nivel: varchar("nivel", { length: 20 }).notNull(),
});

export const cicloAdmision = pgTable(
  "ciclo_admision",
  {
    examenId: varchar("examen_id", { length: 20 })
      .notNull()
      .references(() => examen.id),
    anio: smallint("anio").notNull(),
    fechaExamen: date("fecha_examen", { mode: "string" }),
    convocatoriaEn: date("convocatoria_en", { mode: "string" }),
  },
  (t) => [primaryKey({ columns: [t.examenId, t.anio] })],
);

export const area = pgTable(
  "area",
  {
    id: varchar("id", { length: 20 }).primaryKey(),
    examenId: varchar("examen_id", { length: 20 })
      .notNull()
      .references(() => examen.id),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    tipo: varchar("tipo", { length: 12 }).notNull(),
    cuentaPuntaje: boolean("cuenta_puntaje").notNull().default(true),
    orden: smallint("orden").notNull().default(0),
  },
  (t) => [check("area_tipo_ck", sql`${t.tipo} in ('transversal','modulo')`)],
);

export const subarea = pgTable(
  "subarea",
  {
    id: varchar("id", { length: 30 }).primaryKey(),
    areaId: varchar("area_id", { length: 20 })
      .notNull()
      .references(() => area.id),
    nombre: varchar("nombre", { length: 160 }).notNull(),
    reactivosExamen: smallint("reactivos_examen").notNull(),
    orden: smallint("orden").notNull().default(0),
  },
  (t) => [check("subarea_peso_ck", sql`${t.reactivosExamen} > 0`)],
);

export const tema = pgTable("tema", {
  id: varchar("id", { length: 40 }).primaryKey(),
  subareaId: varchar("subarea_id", { length: 30 })
    .notNull()
    .references(() => subarea.id),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  orden: smallint("orden").notNull().default(0),
});

export const errorCatalogo = pgTable("error_catalogo", {
  id: varchar("id", { length: 60 }).primaryKey(),
  areaId: varchar("area_id", { length: 20 }).references(() => area.id),
  descripcion: text("descripcion").notNull(),
  recomendacion: text("recomendacion").notNull(),
});

export const texto = pgTable("texto", {
  id: varchar("id", { length: 20 }).primaryKey(),
  ambito: varchar("ambito", { length: 60 }).notNull(),
  tipoTexto: varchar("tipo_texto", { length: 120 }).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  /** Párrafos o versos separados por salto de línea doble. */
  cuerpo: text("cuerpo").notNull(),
  esVerso: boolean("es_verso").notNull().default(false),
  autoria: varchar("autoria", { length: 200 }),
});

export const ruta = pgTable("ruta", {
  id: varchar("id", { length: 40 }).primaryKey(),
  examenId: varchar("examen_id", { length: 20 })
    .notNull()
    .references(() => examen.id),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  /** Etiquetas de grupo que también aplican a esta ruta (p. ej. "salud,todas"). */
  grupos: text("grupos").notNull().default("todas"),
  /** Una etiqueta de grupo ("todas", "salud") que el banco usa pero que nadie elige como ruta. */
  esGrupo: boolean("es_grupo").notNull().default(false),
  carrera: varchar("carrera", { length: 120 }),
});

/* ───────────────────────── Banco de reactivos ───────────────────────── */

export const importacion = pgTable(
  "importacion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ejecutadaPor: text("ejecutada_por").references(() => cuenta.id, { onDelete: "set null" }),
    banco: varchar("banco", { length: 200 }).notNull(),
    archivo: varchar("archivo", { length: 200 }).notNull(),
    checksum: char("checksum", { length: 64 }).notNull(),
    estado: varchar("estado", { length: 12 }).notNull(),
    versionesNuevas: integer("versiones_nuevas").notNull().default(0),
    errores: text("errores"),
    fecha: ts("fecha").notNull().defaultNow(),
  },
  (t) => [
    // Una importación aceptada no se repite; las rechazadas sí pueden reintentarse.
    uniqueIndex("importacion_checksum_uk").on(t.checksum).where(sql`${t.estado} = 'aceptada'`),
    check("importacion_estado_ck", sql`${t.estado} in ('aceptada','rechazada')`),
  ],
);

export const reactivo = pgTable("reactivo", {
  id: varchar("id", { length: 30 }).primaryKey(),
  creadoEn: creado(),
});

export const ESTADOS_REACTIVO = ["borrador", "revisado_ia", "validado", "publicado", "en_revision", "retirado"] as const;

export const reactivoVersion = pgTable(
  "reactivo_version",
  {
    reactivoId: varchar("reactivo_id", { length: 30 })
      .notNull()
      .references(() => reactivo.id),
    version: smallint("version").notNull(),
    temaId: varchar("tema_id", { length: 40 })
      .notNull()
      .references(() => tema.id),
    textoId: varchar("texto_id", { length: 20 }).references(() => texto.id),
    importacionId: uuid("importacion_id")
      .notNull()
      .references(() => importacion.id),
    origen: varchar("origen", { length: 10 }).notNull().default("humano"),
    validadoPor: varchar("validado_por", { length: 200 }).notNull(),
    validadoEn: date("validado_en", { mode: "string" }).notNull(),
    habilidad: varchar("habilidad", { length: 30 }).notNull(),
    dificultadEstimada: smallint("dificultad_estimada").notNull(),
    formato: varchar("formato", { length: 40 }).notNull(),
    enunciado: text("enunciado").notNull(),
    explicacion: text("explicacion").notNull(),
    tiempoEstimadoSeg: smallint("tiempo_estimado_seg").notNull(),
    estado: varchar("estado", { length: 14 }).notNull(),
    /** Datos de revisión que trae el JSON (rúbrica, cambios); se conservan para exportar sin pérdida. */
    revision: jsonb("revision"),
    /** Ficha de datos: variables con su descripción, mostradas antes de la pregunta. */
    datos: jsonb("datos").$type<{ tex: string; desc: string }[]>(),
    /** Gráfica para la revisión (nunca en el examen). */
    figura: jsonb("figura").$type<import("@/lib/figura").Figura>(),
    /** Estructura química en SMILES para la revisión. */
    smiles: text("smiles"),
    creadoEn: creado(),
  },
  (t) => [
    primaryKey({ columns: [t.reactivoId, t.version] }),
    index("reactivo_version_estado_ix").on(t.estado, t.temaId),
    check("rv_dificultad_ck", sql`${t.dificultadEstimada} between 1 and 3`),
    check(
      "rv_estado_ck",
      sql`${t.estado} in ('borrador','revisado_ia','validado','publicado','en_revision','retirado')`,
    ),
  ],
);

export const opcion = pgTable(
  "opcion",
  {
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    opcionId: char("opcion_id", { length: 1 }).notNull(),
    texto: text("texto").notNull(),
    correcta: boolean("correcta").notNull(),
    argumentacion: text("argumentacion").notNull(),
    errorId: varchar("error_id", { length: 60 }).references(() => errorCatalogo.id),
  },
  (t) => [
    primaryKey({ columns: [t.reactivoId, t.version, t.opcionId] }),
    foreignKey({ columns: [t.reactivoId, t.version], foreignColumns: [reactivoVersion.reactivoId, reactivoVersion.version] }),
    check("opcion_id_ck", sql`${t.opcionId} in ('A','B','C')`),
    check("opcion_error_ck", sql`(${t.correcta} and ${t.errorId} is null) or (not ${t.correcta} and ${t.errorId} is not null)`),
  ],
);

export const referencia = pgTable(
  "referencia",
  {
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    orden: smallint("orden").notNull(),
    fuente: varchar("fuente", { length: 300 }).notNull(),
    ubicacion: varchar("ubicacion", { length: 300 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.reactivoId, t.version, t.orden] }),
    foreignKey({ columns: [t.reactivoId, t.version], foreignColumns: [reactivoVersion.reactivoId, reactivoVersion.version] }),
  ],
);

export const reactivoRuta = pgTable(
  "reactivo_ruta",
  {
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    /** "todas" se expande al importar a cada ruta del examen. */
    rutaId: varchar("ruta_id", { length: 40 })
      .notNull()
      .references(() => ruta.id),
  },
  (t) => [
    primaryKey({ columns: [t.reactivoId, t.version, t.rutaId] }),
    foreignKey({ columns: [t.reactivoId, t.version], foreignColumns: [reactivoVersion.reactivoId, reactivoVersion.version] }),
  ],
);

export const release = pgTable("release", {
  version: varchar("version", { length: 20 }).primaryKey(),
  examenId: varchar("examen_id", { length: 20 })
    .notNull()
    .references(() => examen.id),
  publicadoPor: text("publicado_por").references(() => cuenta.id, { onDelete: "set null" }),
  publicadoEn: ts("publicado_en").notNull().defaultNow(),
  checksum: char("checksum", { length: 64 }).notNull(),
  notas: text("notas"),
  vigente: boolean("vigente").notNull().default(false),
});

export const releaseItem = pgTable(
  "release_item",
  {
    releaseVersion: varchar("release_version", { length: 20 })
      .notNull()
      .references(() => release.version),
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.releaseVersion, t.reactivoId] }),
    foreignKey({ columns: [t.reactivoId, t.version], foreignColumns: [reactivoVersion.reactivoId, reactivoVersion.version] }),
  ],
);

export const estadisticaReactivo = pgTable(
  "estadistica_reactivo",
  {
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    n: integer("n").notNull().default(0),
    p: numeric("p", { precision: 5, scale: 4 }),
    discriminacion: numeric("discriminacion", { precision: 5, scale: 4 }),
    banderaRevision: boolean("bandera_revision").notNull().default(false),
    motivoBandera: varchar("motivo_bandera", { length: 200 }),
    calculadoEn: ts("calculado_en").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.reactivoId, t.version] }),
    foreignKey({ columns: [t.reactivoId, t.version], foreignColumns: [reactivoVersion.reactivoId, reactivoVersion.version] }),
  ],
);

export const estadisticaOpcion = pgTable(
  "estadistica_opcion",
  {
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    opcionId: char("opcion_id", { length: 1 }).notNull(),
    vecesElegida: integer("veces_elegida").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.reactivoId, t.version, t.opcionId] }),
    foreignKey({
      columns: [t.reactivoId, t.version, t.opcionId],
      foreignColumns: [opcion.reactivoId, opcion.version, opcion.opcionId],
    }),
  ],
);

export const reporteError = pgTable(
  "reporte_error",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    cuentaId: text("cuenta_id").references(() => cuenta.id, { onDelete: "set null" }),
    motivo: text("motivo").notNull(),
    estado: varchar("estado", { length: 12 }).notNull().default("abierto"),
    creadoEn: creado(),
  },
  (t) => [
    foreignKey({ columns: [t.reactivoId, t.version], foreignColumns: [reactivoVersion.reactivoId, reactivoVersion.version] }),
    check("reporte_estado_ck", sql`${t.estado} in ('abierto','confirmado','descartado')`),
  ],
);

export const video = pgTable("video", {
  id: uuid("id").primaryKey().defaultRandom(),
  temaId: varchar("tema_id", { length: 40 })
    .notNull()
    .references(() => tema.id),
  reactivoId: varchar("reactivo_id", { length: 30 }).references(() => reactivo.id),
  url: varchar("url", { length: 400 }).notNull(),
  duracionSeg: smallint("duracion_seg").notNull(),
  plataforma: varchar("plataforma", { length: 40 }).notNull(),
});

/* ───────────────────────── Plantillas ───────────────────────── */

export const plantilla = pgTable(
  "plantilla",
  {
    id: varchar("id", { length: 60 }).primaryKey(),
    rutaId: varchar("ruta_id", { length: 40 })
      .notNull()
      .references(() => ruta.id),
    nombre: varchar("nombre", { length: 200 }).notNull(),
    /** mini | diagnostico | simulacro | muestra */
    modo: varchar("modo", { length: 14 }).notNull(),
    tiempoLimiteMin: smallint("tiempo_limite_min").notNull(),
    umbralDomina: numeric("umbral_domina", { precision: 3, scale: 2 }).notNull().default("0.80"),
    umbralDesarrollo: numeric("umbral_desarrollo", { precision: 3, scale: 2 }).notNull().default("0.50"),
    minimoReportar: smallint("minimo_reportar").notNull().default(3),
    familiaEquivalencia: varchar("familia_equivalencia", { length: 60 }),
    /** Cronómetro único para todo el intento (simulacro) o uno por sección (diagnóstico). */
    cronometroGlobal: boolean("cronometro_global").notNull().default(false),
    notas: text("notas"),
    activa: boolean("activa").notNull().default(true),
  },
  (t) => [
    check("plantilla_umbral_ck", sql`0 < ${t.umbralDesarrollo} and ${t.umbralDesarrollo} < ${t.umbralDomina} and ${t.umbralDomina} <= 1`),
    check("plantilla_min_ck", sql`${t.minimoReportar} >= 1`),
    check("plantilla_modo_ck", sql`${t.modo} in ('mini','diagnostico','simulacro','muestra')`),
  ],
);

export const plantillaSeccion = pgTable(
  "plantilla_seccion",
  {
    plantillaId: varchar("plantilla_id", { length: 60 })
      .notNull()
      .references(() => plantilla.id),
    numero: smallint("numero").notNull(),
    areaId: varchar("area_id", { length: 20 })
      .notNull()
      .references(() => area.id),
    tiempoLimiteMin: smallint("tiempo_limite_min").notNull(),
  },
  (t) => [primaryKey({ columns: [t.plantillaId, t.numero] })],
);

export const plantillaReactivo = pgTable(
  "plantilla_reactivo",
  {
    plantillaId: varchar("plantilla_id", { length: 60 })
      .notNull()
      .references(() => plantilla.id),
    reactivoId: varchar("reactivo_id", { length: 30 })
      .notNull()
      .references(() => reactivo.id),
    seccion: smallint("seccion").notNull(),
    orden: smallint("orden").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.plantillaId, t.reactivoId] }),
    uniqueIndex("plantilla_reactivo_orden_uk").on(t.plantillaId, t.orden),
    foreignKey({ columns: [t.plantillaId, t.seccion], foreignColumns: [plantillaSeccion.plantillaId, plantillaSeccion.numero] }),
  ],
);

/* ───────────────────────── Alumno ───────────────────────── */

export const perfilAlumno = pgTable(
  "perfil_alumno",
  {
    cuentaId: text("cuenta_id")
      .primaryKey()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    nivel: varchar("nivel", { length: 14 }).notNull(),
    carreraObjetivo: varchar("carrera_objetivo", { length: 120 }).notNull(),
    rutaId: varchar("ruta_id", { length: 40 })
      .notNull()
      .references(() => ruta.id),
    examenId: varchar("examen_id", { length: 20 })
      .notNull()
      .references(() => examen.id),
    cicloAnio: smallint("ciclo_anio").notNull(),
    alias: varchar("alias", { length: 24 }).notNull(),
    visibleEnRanking: boolean("visible_en_ranking").notNull().default(true),
    temaInterfaz: varchar("tema_interfaz", { length: 8 }).notNull().default("sistema"),
    repasoEspaciado: boolean("repaso_espaciado").notNull().default(true),
    /** Código de referido con el que llegó (para el 15 % en su primera compra). */
    llegoConReferido: varchar("llego_con_referido", { length: 16 }),
  },
  (t) => [
    uniqueIndex("perfil_alias_uk").on(sql`lower(${t.alias})`),
    foreignKey({ columns: [t.examenId, t.cicloAnio], foreignColumns: [cicloAdmision.examenId, cicloAdmision.anio] }),
    check("perfil_tema_ck", sql`${t.temaInterfaz} in ('claro','oscuro','sistema')`),
  ],
);

export const preferenciaContacto = pgTable(
  "preferencia_contacto",
  {
    cuentaId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    canal: varchar("canal", { length: 10 }).notNull(),
    tipo: varchar("tipo", { length: 20 }).notNull(),
    activo: boolean("activo").notNull().default(false),
    destino: text("destino"),
    actualizadoEn: ts("actualizado_en").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.cuentaId, t.canal, t.tipo] }),
    check("pref_whatsapp_ck", sql`${t.canal} <> 'whatsapp' or ${t.destino} is not null`),
  ],
);

export const enlaceCompartido = pgTable(
  "enlace_compartido",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cuentaId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
    tipo: varchar("tipo", { length: 8 }).notNull(),
    canal: varchar("canal", { length: 10 }).notNull().default("copiar"),
    imagenUrl: varchar("imagen_url", { length: 500 }),
    /** Gráfica congelada: lo único que ve quien abre un enlace de avance. Nunca respuestas. */
    datos: jsonb("datos"),
    /** Para enlaces de pago: el producto que se pide. */
    productoSku: varchar("producto_sku", { length: 40 }),
    creadoEn: creado(),
    venceEn: ts("vence_en").notNull(),
    usadoEn: ts("usado_en"),
    revocadoEn: ts("revocado_en"),
  },
  (t) => [
    check("enlace_tipo_ck", sql`${t.tipo} in ('avance','pago')`),
    check(
      "enlace_vence_ck",
      sql`(${t.tipo} = 'avance' and ${t.venceEn} <= ${t.creadoEn} + interval '30 days') or (${t.tipo} = 'pago' and ${t.venceEn} <= ${t.creadoEn} + interval '7 days')`,
    ),
  ],
);

/* ───────────────────────── Intentos ───────────────────────── */

export const intento = pgTable(
  "intento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cuentaId: text("cuenta_id").references(() => cuenta.id, { onDelete: "set null" }),
    sesionAnonimaId: uuid("sesion_anonima_id"),
    plantillaId: varchar("plantilla_id", { length: 60 }).references(() => plantilla.id),
    releaseVersion: varchar("release_version", { length: 20 })
      .notNull()
      .references(() => release.version),
    /** mini | diagnostico | simulacro | muestra | practica */
    modo: varchar("modo", { length: 14 }).notNull(),
    /** en_curso | enviado | abandonado */
    estado: varchar("estado", { length: 12 }).notNull().default("en_curso"),
    semilla: bigint("semilla", { mode: "number" }).notNull(),
    /** Para práctica: subárea o tema que se practica. */
    filtro: varchar("filtro", { length: 60 }),
    iniciaEn: ts("inicia_en").notNull().defaultNow(),
    venceEn: ts("vence_en").notNull(),
    enviadoEn: ts("enviado_en"),
    ultimaActividadEn: ts("ultima_actividad_en").notNull().defaultNow(),
  },
  (t) => [
    index("intento_cuenta_ix").on(t.cuentaId, t.enviadoEn),
    // D7 (con la salvedad de ARCO: al borrar la cuenta queda anónimo sin sesión).
    check("intento_dueno_ck", sql`${t.sesionAnonimaId} is null or (${t.cuentaId} is null and ${t.modo} = 'mini')`),
    check("intento_estado_ck", sql`${t.estado} in ('en_curso','enviado','abandonado')`),
  ],
);

export const seccionIntento = pgTable(
  "seccion_intento",
  {
    intentoId: uuid("intento_id")
      .notNull()
      .references(() => intento.id, { onDelete: "cascade" }),
    numero: smallint("numero").notNull(),
    areaId: varchar("area_id", { length: 20 }).references(() => area.id),
    tiempoLimiteMin: smallint("tiempo_limite_min").notNull(),
    estado: varchar("estado", { length: 12 }).notNull().default("pendiente"),
    iniciaEn: ts("inicia_en"),
    venceEn: ts("vence_en"),
    terminadaEn: ts("terminada_en"),
  },
  (t) => [
    primaryKey({ columns: [t.intentoId, t.numero] }),
    check("seccion_estado_ck", sql`${t.estado} in ('pendiente','en_curso','terminada')`),
  ],
);

export const itemIntento = pgTable(
  "item_intento",
  {
    intentoId: uuid("intento_id")
      .notNull()
      .references(() => intento.id, { onDelete: "cascade" }),
    orden: smallint("orden").notNull(),
    seccion: smallint("seccion").notNull(),
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    /** Permutación de ABC: la letra en la posición i es la opción original que se muestra en i. */
    ordenOpciones: char("orden_opciones", { length: 3 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.intentoId, t.orden] }),
    foreignKey({ columns: [t.intentoId, t.seccion], foreignColumns: [seccionIntento.intentoId, seccionIntento.numero] }).onDelete(
      "cascade",
    ),
    foreignKey({ columns: [t.reactivoId, t.version], foreignColumns: [reactivoVersion.reactivoId, reactivoVersion.version] }),
    index("item_intento_reactivo_ix").on(t.reactivoId, t.version),
  ],
);

export const respuesta = pgTable(
  "respuesta",
  {
    intentoId: uuid("intento_id").notNull(),
    orden: smallint("orden").notNull(),
    reactivoId: varchar("reactivo_id", { length: 30 }).notNull(),
    version: smallint("version").notNull(),
    opcionId: char("opcion_id", { length: 1 }),
    correcta: boolean("correcta").notNull().default(false),
    errorId: varchar("error_id", { length: 60 }).references(() => errorCatalogo.id),
    marcadaRevisar: boolean("marcada_revisar").notNull().default(false),
    tiempoMs: integer("tiempo_ms"),
    idIdempotencia: uuid("id_idempotencia").notNull().unique(),
    respondidaEn: ts("respondida_en").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.intentoId, t.orden] }),
    foreignKey({ columns: [t.intentoId, t.orden], foreignColumns: [itemIntento.intentoId, itemIntento.orden] }).onDelete("cascade"),
    // D9: la opción pertenece a la misma versión del ítem.
    foreignKey({
      columns: [t.reactivoId, t.version, t.opcionId],
      foreignColumns: [opcion.reactivoId, opcion.version, opcion.opcionId],
    }),
  ],
);

export const resultado = pgTable("resultado", {
  intentoId: uuid("intento_id")
    .primaryKey()
    .references(() => intento.id, { onDelete: "cascade" }),
  global: numeric("global", { precision: 5, scale: 2 }),
  nivel: varchar("nivel", { length: 24 }),
  cobertura: numeric("cobertura", { precision: 4, scale: 3 }).notNull(),
  descripcion: text("descripcion").notNull(),
  versionAlgoritmo: varchar("version_algoritmo", { length: 12 }).notNull(),
  versionTextos: varchar("version_textos", { length: 12 }).notNull(),
  calculadoEn: ts("calculado_en").notNull().defaultNow(),
});

export const resultadoArea = pgTable(
  "resultado_area",
  {
    intentoId: uuid("intento_id")
      .notNull()
      .references(() => resultado.intentoId, { onDelete: "cascade" }),
    areaId: varchar("area_id", { length: 20 })
      .notNull()
      .references(() => area.id),
    presentados: smallint("presentados").notNull(),
    aciertos: smallint("aciertos").notNull(),
    dominio: numeric("dominio", { precision: 5, scale: 4 }),
    nivel: varchar("nivel", { length: 24 }),
  },
  (t) => [primaryKey({ columns: [t.intentoId, t.areaId] })],
);

export const resultadoSubarea = pgTable(
  "resultado_subarea",
  {
    intentoId: uuid("intento_id")
      .notNull()
      .references(() => resultado.intentoId, { onDelete: "cascade" }),
    subareaId: varchar("subarea_id", { length: 30 })
      .notNull()
      .references(() => subarea.id),
    presentados: smallint("presentados").notNull(),
    aciertos: smallint("aciertos").notNull(),
    dominio: numeric("dominio", { precision: 5, scale: 4 }),
    nivel: varchar("nivel", { length: 24 }),
    prioridad: numeric("prioridad", { precision: 7, scale: 3 }),
    lugarPrioridad: smallint("lugar_prioridad"),
  },
  (t) => [primaryKey({ columns: [t.intentoId, t.subareaId] })],
);

export const resultadoTema = pgTable(
  "resultado_tema",
  {
    intentoId: uuid("intento_id")
      .notNull()
      .references(() => resultado.intentoId, { onDelete: "cascade" }),
    temaId: varchar("tema_id", { length: 40 })
      .notNull()
      .references(() => tema.id),
    presentados: smallint("presentados").notNull(),
    aciertos: smallint("aciertos").notNull(),
    dominio: numeric("dominio", { precision: 5, scale: 4 }),
    nivel: varchar("nivel", { length: 24 }),
  },
  (t) => [primaryKey({ columns: [t.intentoId, t.temaId] })],
);

export const errorFrecuente = pgTable(
  "error_frecuente",
  {
    intentoId: uuid("intento_id")
      .notNull()
      .references(() => resultado.intentoId, { onDelete: "cascade" }),
    errorId: varchar("error_id", { length: 60 })
      .notNull()
      .references(() => errorCatalogo.id),
    veces: smallint("veces").notNull(),
    lugar: smallint("lugar").notNull(),
  },
  (t) => [primaryKey({ columns: [t.intentoId, t.errorId] }), check("ef_veces_ck", sql`${t.veces} >= 2 and ${t.lugar} between 1 and 3`)],
);

/* ───────────────────────── Comercio ───────────────────────── */

export const producto = pgTable(
  "producto",
  {
    sku: varchar("sku", { length: 40 }).primaryKey(),
    examenId: varchar("examen_id", { length: 20 }).notNull(),
    cicloAnio: smallint("ciclo_anio").notNull(),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    descripcion: text("descripcion"),
    tipo: varchar("tipo", { length: 10 }).notNull(),
    precioMxn: numeric("precio_mxn", { precision: 8, scale: 2 }).notNull(),
    /** Áreas que abre el producto, separadas por coma; nulo = todas las del examen. */
    areas: text("areas"),
    /** Ruta a la que va dirigido (nulo = cualquiera del examen). */
    rutaId: varchar("ruta_id", { length: 40 }).references(() => ruta.id),
    vigenteDesde: date("vigente_desde", { mode: "string" }).notNull(),
    activo: boolean("activo").notNull().default(true),
    orden: smallint("orden").notNull().default(0),
  },
  (t) => [
    foreignKey({ columns: [t.examenId, t.cicloAnio], foreignColumns: [cicloAdmision.examenId, cicloAdmision.anio] }),
    check("producto_precio_ck", sql`${t.precioMxn} > 0`),
    check("producto_tipo_ck", sql`${t.tipo} in ('pase','paquete')`),
  ],
);

export const cupon = pgTable(
  "cupon",
  {
    codigo: varchar("codigo", { length: 30 }).primaryKey(),
    descuentoPct: smallint("descuento_pct").notNull(),
    vigenteHasta: date("vigente_hasta", { mode: "string" }).notNull(),
    usosMax: integer("usos_max").notNull(),
    usos: integer("usos").notNull().default(0),
  },
  (t) => [check("cupon_pct_ck", sql`${t.descuentoPct} between 1 and 100`), check("cupon_usos_ck", sql`${t.usos} <= ${t.usosMax}`)],
);

export const codigoReferido = pgTable(
  "codigo_referido",
  {
    codigo: varchar("codigo", { length: 16 }).primaryKey(),
    cuentaId: text("cuenta_id")
      .notNull()
      .unique()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    descuentoPct: smallint("descuento_pct").notNull().default(15),
    activo: boolean("activo").notNull().default(true),
    creadoEn: creado(),
  },
  (t) => [check("referido_pct_ck", sql`${t.descuentoPct} between 1 and 100`)],
);

export const promocion = pgTable(
  "promocion",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    examenId: varchar("examen_id", { length: 20 }).notNull(),
    cicloAnio: smallint("ciclo_anio").notNull(),
    descuentoPct: smallint("descuento_pct").notNull(),
    diasAntesExamen: smallint("dias_antes_examen").notNull(),
    activa: boolean("activa").notNull().default(true),
  },
  (t) => [
    foreignKey({ columns: [t.examenId, t.cicloAnio], foreignColumns: [cicloAdmision.examenId, cicloAdmision.anio] }),
    check("promo_pct_ck", sql`${t.descuentoPct} between 1 and 100`),
  ],
);

export const orden = pgTable(
  "orden",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    beneficiarioId: text("beneficiario_id").references(() => cuenta.id, { onDelete: "set null" }),
    enlaceId: uuid("enlace_id")
      .unique()
      .references(() => enlaceCompartido.id, { onDelete: "set null" }),
    productoSku: varchar("producto_sku", { length: 40 })
      .notNull()
      .references(() => producto.sku),
    cuponCodigo: varchar("cupon_codigo", { length: 30 }).references(() => cupon.codigo),
    referidoCodigo: varchar("referido_codigo", { length: 16 }).references(() => codigoReferido.codigo, { onDelete: "set null" }),
    promocionId: varchar("promocion_id", { length: 40 }).references(() => promocion.id),
    quienPaga: varchar("quien_paga", { length: 10 }).notNull(),
    precioLista: numeric("precio_lista", { precision: 8, scale: 2 }).notNull(),
    total: numeric("total", { precision: 8, scale: 2 }).notNull(),
    estado: varchar("estado", { length: 12 }).notNull().default("pendiente"),
    proveedor: varchar("proveedor", { length: 20 }).notNull(),
    referenciaCheckout: varchar("referencia_checkout", { length: 200 }),
    creadaEn: ts("creada_en").notNull().defaultNow(),
  },
  (t) => [
    // D16: como mucho un descuento.
    check(
      "orden_descuento_ck",
      sql`((${t.cuponCodigo} is not null)::int + (${t.referidoCodigo} is not null)::int + (${t.promocionId} is not null)::int) <= 1`,
    ),
    check("orden_quien_ck", sql`${t.quienPaga} in ('alumno','familiar','otro')`),
    check("orden_estado_ck", sql`${t.estado} in ('pendiente','pagada','expirada','reembolsada')`),
  ],
);

export const pago = pgTable("pago", {
  id: uuid("id").primaryKey().defaultRandom(),
  ordenId: uuid("orden_id")
    .notNull()
    .references(() => orden.id),
  proveedor: varchar("proveedor", { length: 20 }).notNull(),
  referenciaExterna: varchar("referencia_externa", { length: 120 }).notNull().unique(),
  metodo: varchar("metodo", { length: 14 }).notNull(),
  estado: varchar("estado", { length: 20 }).notNull(),
  montoMxn: numeric("monto_mxn", { precision: 8, scale: 2 }).notNull(),
  confirmadoEn: ts("confirmado_en"),
});

export const acceso = pgTable(
  "acceso",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cuentaId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    /** Nulo en la prueba de 3 días. */
    productoSku: varchar("producto_sku", { length: 40 }).references(() => producto.sku),
    ordenId: uuid("orden_id")
      .unique()
      .references(() => orden.id),
    origen: varchar("origen", { length: 10 }).notNull(),
    desde: ts("desde").notNull(),
    hasta: ts("hasta").notNull(),
    revocadoEn: ts("revocado_en"),
  },
  (t) => [
    check("acceso_rango_ck", sql`${t.desde} <= ${t.hasta}`),
    check("acceso_origen_ck", sql`${t.origen} in ('orden','cortesia','prueba')`),
    check("acceso_prueba_ck", sql`${t.origen} <> 'prueba' or (${t.ordenId} is null and ${t.hasta} <= ${t.desde} + interval '3 days')`),
    // D24: una sola prueba por cuenta.
    uniqueIndex("acceso_prueba_uk").on(t.cuentaId).where(sql`${t.origen} = 'prueba'`),
  ],
);

export const limitePlan = pgTable(
  "limite_plan",
  {
    plan: varchar("plan", { length: 10 }).notNull(),
    recurso: varchar("recurso", { length: 20 }).notNull(),
    /** Nulo = ilimitado; 0 = no disponible. */
    cantidad: integer("cantidad"),
    periodo: varchar("periodo", { length: 10 }).notNull(),
    textoMuro: text("texto_muro"),
  },
  (t) => [
    primaryKey({ columns: [t.plan, t.recurso] }),
    check("limite_plan_ck", sql`${t.plan} in ('anonimo','gratis','prueba','pase')`),
    check("limite_periodo_ck", sql`${t.periodo} in ('dia','semana','mes','temporada')`),
  ],
);

/* ───────────────────────── Motivación ───────────────────────── */

export const eventoPuntos = pgTable(
  "evento_puntos",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    cuentaId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    intentoId: uuid("intento_id").references(() => intento.id, { onDelete: "set null" }),
    motivo: varchar("motivo", { length: 14 }).notNull(),
    puntos: integer("puntos").notNull(),
    idIdempotencia: varchar("id_idempotencia", { length: 120 }).notNull().unique(),
    fecha: ts("fecha").notNull().defaultNow(),
  },
  (t) => [
    index("evento_puntos_cuenta_ix").on(t.cuentaId, t.fecha),
    check("evento_motivo_ck", sql`${t.motivo} in ('acierto','seccion','insignia','racha','dia')`),
  ],
);

export const racha = pgTable(
  "racha",
  {
    cuentaId: text("cuenta_id")
      .primaryKey()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    actual: smallint("actual").notNull().default(0),
    mejor: smallint("mejor").notNull().default(0),
    ultimoDia: date("ultimo_dia", { mode: "string" }),
    /** Lunes de la semana (o primer día del mes en plan gratis) en que se usó la protección. */
    proteccionUsada: date("proteccion_usada", { mode: "string" }),
    /** Días estudiados, para dibujar el pulso (últimos 60, AAAA-MM-DD). */
    dias: text("dias").notNull().default(""),
  },
  (t) => [check("racha_mejor_ck", sql`${t.mejor} >= ${t.actual}`)],
);

export const insignia = pgTable("insignia", {
  id: varchar("id", { length: 40 }).primaryKey(),
  nombre: varchar("nombre", { length: 80 }).notNull(),
  descripcion: text("descripcion").notNull(),
  condicion: text("condicion").notNull(),
  icono: varchar("icono", { length: 40 }).notNull(),
});

export const cuentaInsignia = pgTable(
  "cuenta_insignia",
  {
    cuentaId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    insigniaId: varchar("insignia_id", { length: 40 })
      .notNull()
      .references(() => insignia.id),
    obtenidaEn: ts("obtenida_en").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.cuentaId, t.insigniaId] })],
);

export const clasificacionSemanal = pgTable(
  "clasificacion_semanal",
  {
    semana: date("semana", { mode: "string" }).notNull(),
    cuentaId: text("cuenta_id")
      .notNull()
      .references(() => cuenta.id, { onDelete: "cascade" }),
    division: varchar("division", { length: 8 }).notNull().default("bronce"),
    grupo: smallint("grupo").notNull().default(1),
    puntos: integer("puntos").notNull().default(0),
    posicion: smallint("posicion"),
  },
  (t) => [
    primaryKey({ columns: [t.semana, t.cuentaId] }),
    check("clasif_div_ck", sql`${t.division} in ('bronce','plata','oro')`),
  ],
);

/* ───────────────────────── Auditoría ───────────────────────── */

export const auditoria = pgTable("auditoria", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: text("actor_id").references(() => cuenta.id, { onDelete: "set null" }),
  accion: varchar("accion", { length: 60 }).notNull(),
  entidad: varchar("entidad", { length: 40 }).notNull(),
  entidadId: varchar("entidad_id", { length: 120 }).notNull(),
  fecha: ts("fecha").notNull().defaultNow(),
});
