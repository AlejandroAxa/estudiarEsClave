/**
 * Las cuatro áreas generales de conocimiento de la BUAP: cada una tiene su
 * página en /carreras/[slug], su ruta de banco (diagnóstico, mini, muestra y
 * simulacro) y la lista de sus licenciaturas.
 *
 * Carreras: oferta educativa de la BUAP (serviciosdes.buap.mx/oferta_educativa,
 * consultada en noviembre de 2026). Cuando la página oficial no pone el área de
 * una carrera se tomó de las guías de admisión 2026. La convocatoria de cada año
 * manda: una carrera puede cambiar de área o de sede.
 */

export type TemaArea = "cuentas" | "archivo" | "expediente" | "plano";

export type GrupoCarreras = { nombre: string; carreras: string[] };

export type AreaGeneral = {
  slug: string;
  nombre: string;
  corto: string;
  /** Ruta del banco con su diagnóstico, mini, muestra y simulacro. */
  rutaId: string;
  /** Módulo general (24) y módulo de área (24) que se suman a las áreas comunes. */
  general: string;
  modulo: string;
  icono: string;
  tema: TemaArea;
  acento: string;
  lema: string;
  texto: string;
  /** Cómo se llama el reporte en el motivo visual del área. */
  reporte: string;
  grupos: GrupoCarreras[];
  nota?: string;
};

export const FUENTE_CARRERAS = "https://serviciosdes.buap.mx/oferta_educativa/";

export const AREAS_GENERALES: AreaGeneral[] = [
  {
    slug: "ciencias-economico-administrativas",
    nombre: "Ciencias Económico Administrativas",
    corto: "Económico Administrativas",
    rutaId: "epiu-economico-administrativas",
    general: "ciencias-sociales",
    modulo: "ciencias-economico-administrativas",
    icono: "Banknote",
    tema: "cuentas",
    acento: "#F7C59F",
    lema: "Números que cuadran, decisiones que se sostienen.",
    texto:
      "Para quien quiere dirigir empresas, llevar las finanzas, comerciar con el mundo o defender un caso. Presentas las áreas comunes, el módulo general de Ciencias sociales y el módulo de Ciencias Económico Administrativas.",
    reporte: "Estado de cuenta",
    grupos: [
      {
        nombre: "Administración y negocios",
        carreras: [
          "Administración de Empresas",
          "Administración Pública y Gestión para el Desarrollo",
          "Administración Turística",
          "Administración y Dirección de Pequeñas y Medianas Empresas",
          "Comercio Internacional",
          "Negocios Internacionales",
          "Gastronomía",
        ],
      },
      {
        nombre: "Contaduría, economía y finanzas",
        carreras: ["Contaduría Pública", "Contaduría y Finanzas Públicas", "Dirección Financiera", "Economía", "Finanzas"],
      },
      {
        nombre: "Comunicación y mercadotecnia",
        carreras: ["Comunicación", "Mercadotecnia y Medios Digitales", "Periodismo"],
      },
      {
        nombre: "Derecho",
        carreras: ["Derecho", "Consultoría Jurídica", "Criminología"],
      },
    ],
    nota: "Derecho, Consultoría Jurídica y Criminología aparecen en esta área en la oferta oficial; algunas guías las ponen en Sociales y Humanidades. Confírmalo en tu convocatoria.",
  },
  {
    slug: "ciencias-sociales-y-humanidades",
    nombre: "Ciencias Sociales y Humanidades",
    corto: "Sociales y Humanidades",
    rutaId: "epiu-sociales-humanidades",
    general: "ciencias-sociales",
    modulo: "ciencias-sociales-y-humanidades",
    icono: "Palette",
    tema: "archivo",
    acento: "#E9D8EF",
    lema: "Leer el mundo, contarlo y cambiarlo.",
    texto:
      "Para quien quiere entender a las personas y a las sociedades, enseñar, crear o investigar la historia. Presentas las áreas comunes, el módulo general de Ciencias sociales y el módulo de Ciencias Sociales y Humanidades.",
    reporte: "Ficha de archivo",
    grupos: [
      {
        nombre: "Sociedad y política",
        carreras: ["Antropología Social", "Ciencias Políticas", "Relaciones Internacionales", "Sociología", "Gestión de la Información"],
      },
      {
        nombre: "Humanidades y lenguas",
        carreras: [
          "Filosofía",
          "Historia",
          "Humanidades",
          "Lingüística y Literatura Hispánica",
          "Enseñanza de Lenguas (Inglés)",
          "Enseñanza del Francés",
          "Enseñanza del Inglés",
        ],
      },
      {
        nombre: "Educación, mente y cuerpo",
        carreras: ["Procesos Educativos", "Psicología", "Psiconeurodesarrollo", "Cultura Física", "Readaptación y Activación Física"],
      },
      {
        nombre: "Artes",
        carreras: ["Arte Digital", "Arte Dramático", "Artes Plásticas", "Cinematografía", "Danza", "Etnocoreología", "Música"],
      },
    ],
    nota: "Psicología, Psiconeurodesarrollo y Cultura Física están en esta área en la oferta oficial; algunas guías las ponen en Naturales y de Salud.",
  },
  {
    slug: "ciencias-naturales-y-de-salud",
    nombre: "Ciencias Naturales y de Salud",
    corto: "Naturales y de Salud",
    rutaId: "epiu-naturales-salud",
    general: "ciencias-experimentales",
    modulo: "ciencias-naturales-y-de-salud",
    icono: "Leaf",
    tema: "expediente",
    acento: "#8FE0C4",
    lema: "La vida, el cuerpo y la salud, de la célula al paciente.",
    texto:
      "Para quien quiere cuidar la salud de personas y animales o estudiar la vida y la química. Presentas las áreas comunes, el módulo general de Ciencias experimentales y el módulo de Ciencias Naturales y de Salud. Medicina tiene su propia evaluación en dos etapas.",
    reporte: "Expediente clínico",
    grupos: [
      {
        nombre: "Salud",
        carreras: [
          "Medicina",
          "Medicina General y Comunitaria",
          "Enfermería",
          "Estomatología",
          "Fisioterapia",
          "Gerontología",
          "Nutrición Clínica",
          "Podología",
          "Biomedicina",
        ],
      },
      {
        nombre: "Química y farmacia",
        carreras: ["Química", "Químico Farmacobiólogo", "Farmacia", "Ciencia Forense"],
      },
      {
        nombre: "Vida y campo",
        carreras: [
          "Biología",
          "Biotecnología",
          "Fauna Silvestre",
          "Medicina Veterinaria y Zootecnia",
          "Ingeniería Agrohidráulica",
          "Ingeniería Agronómica en Recursos Naturales Renovables",
          "Ingeniería Agronómica y Zootecnia",
          "Ingeniería en Agronomía",
          "Ingeniería Agroforestal",
        ],
      },
    ],
    nota: "Medicina presenta la Evaluación de Idoneidad del Perfil Médico: Premedicina y Razonamiento clínico avanzado en marzo, y las áreas comunes en junio.",
  },
  {
    slug: "ingenierias-y-ciencias-exactas",
    nombre: "Ingenierías y Ciencias Exactas",
    corto: "Ingenierías y Exactas",
    rutaId: "epiu-ingenierias-exactas",
    general: "ciencias-experimentales",
    modulo: "ingenierias-y-ciencias-exactas",
    icono: "Cog",
    tema: "plano",
    acento: "#9CC9F5",
    lema: "Medir, modelar y construir.",
    texto:
      "Para quien quiere diseñar máquinas, programar, construir ciudades o hacer matemáticas. Presentas las áreas comunes, el módulo general de Ciencias experimentales y el módulo de Ingenierías y Ciencias Exactas.",
    reporte: "Plano de obra",
    grupos: [
      {
        nombre: "Ciencias exactas",
        carreras: ["Actuaría", "Física", "Física Aplicada", "Matemáticas", "Matemáticas Aplicadas", "Electrónica"],
      },
      {
        nombre: "Computación y datos",
        carreras: [
          "Ciencias de la Computación",
          "Ingeniería en Ciencias de la Computación",
          "Ingeniería en Ciberseguridad",
          "Ingeniería en Ciencia de Datos",
          "Ingeniería en Tecnologías de la Información",
        ],
      },
      {
        nombre: "Ingenierías",
        carreras: [
          "Ingeniería Civil",
          "Ingeniería Industrial",
          "Ingeniería Mecánica y Eléctrica",
          "Ingeniería en Mecatrónica",
          "Ingeniería en Sistemas Automotrices",
          "Ingeniería en Automatización y Autotrónica",
          "Ingeniería en Sistemas y Tecnologías de la Información Industrial",
          "Ingeniería en Procesos y Gestión Industrial",
          "Ingeniería Biomédica",
          "Ingeniería en Energías Renovables",
          "Ingeniería Química",
          "Ingeniería Ambiental",
          "Ingeniería en Alimentos",
          "Ingeniería en Materiales",
          "Ingeniería Textil",
          "Ingeniería Geofísica",
          "Ingeniería Topográfica y Geodésica",
          "Ingeniería Agroindustrial",
        ],
      },
      {
        nombre: "Diseño, ciudad e innovación",
        carreras: [
          "Arquitectura",
          "Diseño Gráfico",
          "Urbanismo y Diseño Ambiental",
          "Gestión de Ciudades Inteligentes y Transiciones Tecnológicas",
          "Innovación Emprendedora",
        ],
      },
    ],
  },
];

export const areaGeneralPorSlug = (slug: string) => AREAS_GENERALES.find((a) => a.slug === slug);
export const areaGeneralPorRuta = (rutaId: string) => AREAS_GENERALES.find((a) => a.rutaId === rutaId);
export const totalCarreras = (a: AreaGeneral) => a.grupos.reduce((n, g) => n + g.carreras.length, 0);

/** Rutas que ofrece el mini diagnóstico sin cuenta: las cuatro áreas y Medicina (EIPM). */
export const OPCIONES_MINI: { id: string; nombre: string; slug: string }[] = [
  ...AREAS_GENERALES.map((a) => ({ id: a.rutaId, nombre: a.nombre, slug: a.slug })),
  { id: "medicina", nombre: "Medicina (EIPM)", slug: "medicina" },
];
