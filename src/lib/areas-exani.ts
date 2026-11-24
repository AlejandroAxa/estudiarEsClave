/**
 * Áreas y módulos del EXANI-II según la Guía para el sustentante del CENEVAL
 * (18 de junio de 2025). Las definiciones están redactadas con palabras
 * propias; los temarios y números de reactivos son datos de la guía. Las
 * preguntas de muestra son originales de Estudiar es Clave: los ejemplos de
 * la guía solo se describen y se cita la página donde están.
 */

export type TipoArea = "transversal" | "diagnostica" | "especifico" | "general";

export type Subarea = { nombre: string; reactivos: number; temas: string[]; temario: string[] };

export type Muestra = {
  contexto?: string;
  enunciado: string;
  opciones: { texto: string; correcta?: boolean; porque: string }[];
  explicacion: string;
};

export type AreaExani = {
  slug: string;
  nombre: string;
  tipo: TipoArea;
  icono: string;
  reactivos: number;
  lema: string;
  definicion: string;
  subareas: Subarea[];
  ejemploGuia: { paginas: string; resumen: string };
  consejo: string[];
  carreras?: string;
  relacionadas: string[];
  muestra: Muestra;
};

export const TIPOS: Record<TipoArea, { nombre: string; nota: string }> = {
  transversal: { nombre: "Área transversal", nota: "La presentan todos los aspirantes y cuenta para el puntaje global." },
  diagnostica: { nombre: "Área diagnóstica", nota: "La presentan todos, pero no cuenta para el puntaje global." },
  especifico: { nombre: "Módulo específico", nota: "Tu universidad elige dos módulos según la carrera (Premedicina va solo)." },
  general: { nombre: "Módulo general", nota: "Para universidades donde eliges varias carreras en orden de preferencia. Solo se combina con el otro módulo general." },
};

export const AREAS: AreaExani[] = [
  {
    slug: "comprension-lectora",
    nombre: "Comprensión lectora",
    tipo: "transversal",
    icono: "BookOpen",
    reactivos: 30,
    lema: "Leer, entender y juzgar lo que dice un texto.",
    definicion:
      "Mide si puedes encontrar datos en un texto, entender lo que quiere decir y valorar cómo está escrito y qué tan bien sostiene sus ideas. Los textos son de estudio, literarios y de la vida social.",
    subareas: [
      {
        nombre: "Ámbito de estudio",
        reactivos: 12,
        temas: ["Identificación de información", "Interpretación", "Evaluación de la forma y el contenido"],
        temario: ["Textos: artículo argumentativo-periodístico y ensayo académico", "Localizar información aunque haya elementos que distraen", "Entender la postura del autor o el objetivo de una investigación", "Elegir la mejor explicación de una idea o valorarla fuera del texto"],
      },
      {
        nombre: "Ámbito literario",
        reactivos: 12,
        temas: ["Identificación de información", "Interpretación", "Evaluación de la forma y el contenido"],
        temario: ["Textos: cuento y poema", "Localizar información en la narración o el poema", "Entender el mensaje de un pasaje o de la obra completa", "Valorar una secuencia narrativa o una figura retórica"],
      },
      {
        nombre: "Ámbito de participación social",
        reactivos: 6,
        temas: ["Identificación de información", "Interpretación", "Evaluación de la forma y el contenido"],
        temario: ["Textos: noticia y documento administrativo", "Localizar datos concretos", "Entender el tema o el requisito de un formato", "Valorar la información y su presentación"],
      },
    ],
    ejemploGuia: {
      paginas: "14 a 20",
      resumen:
        "Un artículo de divulgación sobre niños prodigio con tres preguntas: completar dos datos que da el texto, deducir la consecuencia de un mal acompañamiento y aplicar la idea del autor a un caso hipotético.",
    },
    consejo: [
      "Lee el texto completo antes de ver las preguntas: muchos errores vienen de leer a medias.",
      "Ve y vuelve del texto a la pregunta las veces que haga falta. Eso hacen los lectores expertos.",
      "No hay respuestas parcialmente correctas: la buena cubre todo lo que se pide.",
    ],
    relacionadas: ["redaccion-indirecta", "literatura", "ingles"],
    muestra: {
      contexto:
        "Las ciudades que plantan árboles a lo largo de sus calles registran en verano temperaturas hasta 3 °C más bajas que las zonas sin vegetación. Sin embargo, los especialistas advierten que el beneficio solo se sostiene si se eligen especies nativas, que necesitan menos agua y resisten mejor las plagas locales.",
      enunciado: "¿Qué condición señala el texto para que la estrategia funcione a largo plazo?",
      opciones: [
        { texto: "Plantar la mayor cantidad posible de árboles", porque: "El texto no habla de cantidad, sino del tipo de especie." },
        { texto: "Elegir especies nativas de la región", correcta: true, porque: "Es la condición que ponen los especialistas con el «sin embargo»." },
        { texto: "Regar los árboles todos los días en verano", porque: "Al contrario: las nativas se prefieren porque necesitan menos agua." },
      ],
      explicacion: "La palabra «sin embargo» introduce una condición. Lo que sigue es justo lo que la pregunta busca.",
    },
  },
  {
    slug: "redaccion-indirecta",
    nombre: "Redacción indirecta",
    tipo: "transversal",
    icono: "PenLine",
    reactivos: 30,
    lema: "Reconocer cuál texto está bien escrito, sin tener que redactarlo tú.",
    definicion:
      "Evalúa si sabes elegir el fragmento que respeta la gramática, el significado y la ortografía, y que además es adecuado para quien lo va a leer y para qué se escribe. No es un examen de memoria de reglas: todo se pregunta dentro de un texto.",
    subareas: [
      {
        nombre: "Estudio",
        reactivos: 15,
        temas: ["Comunicativa", "Gramatical y semántica", "Ortográfica"],
        temario: ["Registro lingüístico de la reseña y el ensayo", "Género textual: prólogo", "Concordancia nominal y verbal", "Cohesión gramatical, léxico-semántica y textual", "Grafofonética, puntuación y acentuación"],
      },
      {
        nombre: "Participación social",
        reactivos: 15,
        temas: ["Comunicativa", "Gramatical y semántica", "Ortográfica"],
        temario: ["Registro lingüístico del artículo de opinión y la noticia", "Género textual: crónica", "Concordancia nominal y verbal", "Cohesión gramatical, léxico-semántica y textual", "Grafofonética, puntuación y acentuación"],
      },
    ],
    ejemploGuia: {
      paginas: "22 a 26",
      resumen:
        "Tres preguntas: elegir entre tres párrafos el que tiene el registro formal de un ensayo académico, encontrar el antónimo de un adjetivo según su sentido en el texto y señalar la oración con la tilde bien puesta en un diptongo.",
    },
    consejo: [
      "Las preguntas se basaron en la primera edición (2005) del Diccionario panhispánico de dudas. Si dudas, consulta esa versión.",
      "Lee la opción en voz baja: los errores de concordancia se oyen.",
      "En registro, pregúntate quién lee el texto y dónde se publica.",
    ],
    relacionadas: ["comprension-lectora", "literatura", "ingles"],
    muestra: {
      enunciado: "Elija la oración con la concordancia correcta.",
      opciones: [
        { texto: "Se venden departamentos con vista al mar.", correcta: true, porque: "En la pasiva refleja el verbo concuerda con el sujeto plural «departamentos»." },
        { texto: "Se vende departamentos con vista al mar.", porque: "«Departamentos» es el sujeto y está en plural; el verbo también debe estarlo." },
        { texto: "Habían muchos departamentos con vista al mar.", porque: "«Haber» como impersonal va siempre en singular: «había»." },
      ],
      explicacion: "Ubica primero el sujeto. Con «se» + verbo transitivo, el verbo concuerda con él; con «haber» existencial no hay sujeto y el verbo va en singular.",
    },
  },
  {
    slug: "pensamiento-matematico",
    nombre: "Pensamiento matemático",
    tipo: "transversal",
    icono: "Sigma",
    reactivos: 30,
    lema: "Usar lo matemático para decidir en situaciones reales.",
    definicion:
      "Evalúa si reconoces y usas aritmética, álgebra, geometría, estadística y probabilidad para plantear y resolver problemas de la vida diaria y tomar decisiones con fundamento.",
    subareas: [
      {
        nombre: "Comprensión de lo matemático",
        reactivos: 18,
        temas: ["Conexiones", "Estimación", "Sentido numérico"],
        temario: ["Razones y proporciones", "Interpretación gráfica de ecuaciones lineales", "Ejes de simetría y estimación de trayectorias", "Frecuencias y probabilidad clásica de eventos simples", "Leyes de los exponentes y porcentaje", "Unidades de medida y espacio muestral", "Inecuaciones lineales y simplificación algebraica", "Razones trigonométricas y área", "Media aritmética y desviación estándar"],
      },
      {
        nombre: "Matematización",
        reactivos: 12,
        temas: ["Desarrollo de usos", "Lenguaje matemático", "Resignificaciones"],
        temario: ["Gráficas de ecuaciones de segundo grado y funciones cuadráticas", "Relaciones trigonométricas", "Representación gráfica de información", "Medidas de tendencia central y de dispersión", "Polinomios", "Sistemas de ecuaciones lineales con dos y tres incógnitas", "Variación lineal tabular", "Medidas de posición: deciles, cuartiles y percentiles"],
      },
    ],
    ejemploGuia: {
      paginas: "30",
      resumen: "Una operación combinada con tres polinomios: sumar, restar y multiplicar uno de ellos por un número, cuidando los signos.",
    },
    consejo: [
      "Solo se permite calculadora básica: practica operaciones con fracciones a mano.",
      "Los distractores suelen ser el resultado de un error típico de signos o de la propiedad distributiva.",
      "Estima antes de calcular para descartar opciones absurdas.",
    ],
    relacionadas: ["aritmetica", "probabilidad-y-estadistica", "calculo-diferencial-e-integral"],
    muestra: {
      enunciado: "Una receta lleva 3 tazas de harina por cada 2 tazas de leche. Si se usan 7.5 tazas de harina, ¿cuántas tazas de leche se necesitan?",
      opciones: [
        { texto: "5", correcta: true, porque: "7.5 × 2 ÷ 3 = 5. La razón harina:leche se mantiene." },
        { texto: "6.5", porque: "Resta 1 porque «hay una taza de diferencia»: las proporciones no se mantienen sumando o restando." },
        { texto: "11.25", porque: "Invierte la razón: 7.5 × 3 ÷ 2." },
      ],
      explicacion: "Plantea 3/2 = 7.5/x y despeja: x = 7.5 × 2 / 3 = 5.",
    },
  },
  {
    slug: "ingles",
    nombre: "Inglés",
    tipo: "diagnostica",
    icono: "Languages",
    reactivos: 30,
    lema: "Leer y reconocer buen inglés en nivel B1.",
    definicion:
      "Evalúa comprensión lectora y redacción indirecta en inglés en nivel B1 del Marco Común Europeo. Es diagnóstica: tu universidad la usa para ubicarte, pero no suma al puntaje global.",
    subareas: [
      {
        nombre: "Comprensión lectora",
        reactivos: 15,
        temas: ["Leer para orientarse", "Leer en busca de información y argumento"],
        temario: ["Resumir información específica", "Ideas principales y secundarias", "Datos específicos y premisas", "Tipos de texto y su público", "Lenguaje idiomático, figurado y abstracto", "Significado de una palabra por el contexto", "Estructura: argumento, causa-efecto, problema-solución", "Título adecuado e inferencias"],
      },
      {
        nombre: "Redacción indirecta",
        reactivos: 15,
        temas: ["Escritura creativa", "Redacción de reportes y ensayos"],
        temario: ["Formas verbales precisas", "Paráfrasis y síntesis: estructura, tono y estilo", "Estructuras gramaticales", "Uso de vocabulario", "Lenguaje concreto, abstracto o idiomático", "Subtítulo adecuado a un texto"],
      },
    ],
    ejemploGuia: {
      paginas: "32 a 37",
      resumen:
        "Un texto de divulgación sobre cómo era la atmósfera de la Tierra primitiva, con preguntas sobre el referente de una frase y la idea central de un párrafo, más un ejercicio de completar huecos con preposiciones y tiempos verbales.",
    },
    consejo: [
      "Aunque no cuente para el puntaje, muchas universidades usan el resultado para asignarte cursos de inglés.",
      "Repasa preposiciones de lugar y tiempo (in, on, at, since, for, from) y el pasado simple contra el perfecto.",
    ],
    relacionadas: ["comprension-lectora", "redaccion-indirecta"],
    muestra: {
      enunciado: "Choose the option that completes the sentence: «By the time we got to the station, the train _______.»",
      opciones: [
        { texto: "had already left", correcta: true, porque: "Past perfect: the train left before another past action (we got there)." },
        { texto: "has already left", porque: "Present perfect connects with the present, but the whole sentence is in the past." },
        { texto: "already leaves", porque: "Simple present does not fit a sequence of past events." },
      ],
      explicacion: "«By the time» + pasado simple pide pasado perfecto en la otra oración: una acción terminó antes que la otra.",
    },
  },
  {
    slug: "administracion",
    nombre: "Administración",
    tipo: "especifico",
    icono: "Briefcase",
    reactivos: 24,
    lema: "Cómo se planea, organiza, dirige y controla una organización.",
    definicion:
      "Evalúa los fundamentos de la administración (escuelas, tipos de organizaciones, áreas funcionales y emprendimiento) y cada etapa del proceso administrativo.",
    subareas: [
      {
        nombre: "Fundamentos",
        reactivos: 10,
        temas: ["Enfoques de la administración", "Clasificación de las organizaciones", "Áreas funcionales", "Emprendimiento"],
        temario: ["Teorías, postulados y escuelas de la administración", "Clasificación de empresas y recursos empresariales", "Áreas funcionales: producción, mercadotecnia, finanzas y recursos humanos", "Características del emprendimiento y tipos de emprendedor"],
      },
      {
        nombre: "Proceso administrativo",
        reactivos: 14,
        temas: ["Planeación", "Organización", "Dirección", "Control"],
        temario: ["Etapas y fases del proceso administrativo", "Planeación: características, principios y procesos", "Organización: procesos, estructura y técnicas", "Dirección: principios y elementos", "Control: principios, procesos y técnicas"],
      },
    ],
    ejemploGuia: { paginas: "42", resumen: "Identificar qué área funcional se encarga de promover, distribuir y vender lo que produce una empresa." },
    consejo: ["Haz una tabla con las cuatro etapas del proceso y, en cada una, qué pregunta responde (qué, cómo, quién, qué tan bien).", "Asocia cada escuela con su autor principal: Taylor, Fayol, Mayo, Weber."],
    carreras: "Administración, Contaduría, Negocios internacionales, Mercadotecnia, Turismo.",
    relacionadas: ["economia", "matematicas-financieras", "derecho"],
    muestra: {
      enunciado: "Una empresa decide que en 2027 aumentará sus ventas 15 % y define los pasos, fechas y presupuesto para lograrlo. ¿Qué etapa del proceso administrativo está realizando?",
      opciones: [
        { texto: "Planeación", correcta: true, porque: "Fijar objetivos y decidir cómo alcanzarlos es planear." },
        { texto: "Dirección", porque: "Dirigir es guiar y motivar a las personas mientras ejecutan el plan." },
        { texto: "Control", porque: "Controlar es medir lo logrado y compararlo con lo planeado, después de actuar." },
      ],
      explicacion: "Objetivo + estrategia + calendario + presupuesto = planeación. El control vendrá después, al comparar el 15 % con lo real.",
    },
  },
  {
    slug: "aritmetica",
    nombre: "Aritmética",
    tipo: "especifico",
    icono: "Calculator",
    reactivos: 24,
    lema: "Los números, sus operaciones y los problemas con razones.",
    definicion:
      "Evalúa el dominio de los números reales y sus operaciones, y su uso para modelar y resolver problemas con números racionales. Es la base de todo lo que sigue en matemáticas.",
    subareas: [
      {
        nombre: "Principios de números reales",
        reactivos: 14,
        temas: ["Leyes de los signos", "Leyes de los exponentes", "Jerarquía de operaciones", "Múltiplos y divisores"],
        temario: ["Operaciones con enteros, fracciones y decimales", "Ley de los signos y potenciación", "Signos de agrupación", "Expresiones con radicales", "Notación científica", "Factores primos y reglas de divisibilidad", "Mínimo común múltiplo y máximo común divisor"],
      },
      {
        nombre: "Problemas con números racionales",
        reactivos: 10,
        temas: ["Razones", "Variaciones"],
        temario: ["Razón y proporción", "Porcentaje", "Progresiones aritmética y geométrica", "Reparto proporcional", "Interés simple", "Regla de tres"],
      },
    ],
    ejemploGuia: { paginas: "45", resumen: "Resolver una operación con llaves, corchetes y paréntesis respetando la jerarquía de operaciones y los signos." },
    consejo: ["Elimina signos de agrupación de adentro hacia afuera.", "Practica el mcm y el MCD con factorización prima: es más rápido y no falla."],
    carreras: "Ingenierías, Contaduría, Administración y carreras técnicas.",
    relacionadas: ["pensamiento-matematico", "matematicas-financieras", "probabilidad-y-estadistica"],
    muestra: {
      enunciado: "¿Cuál es el mínimo común múltiplo de 12, 18 y 30?",
      opciones: [
        { texto: "6", porque: "Es el máximo común divisor, no el mínimo común múltiplo." },
        { texto: "180", correcta: true, porque: "12 = 2²·3, 18 = 2·3², 30 = 2·3·5. Se toma cada primo con su mayor exponente: 2²·3²·5 = 180." },
        { texto: "6 480", porque: "Es el producto 12 × 18 × 30: es múltiplo común, pero no el mínimo." },
      ],
      explicacion: "Factoriza en primos y toma cada factor con su exponente más alto.",
    },
  },
  {
    slug: "biologia",
    nombre: "Biología",
    tipo: "especifico",
    icono: "Dna",
    reactivos: 24,
    lema: "De la célula a los ecosistemas.",
    definicion:
      "Evalúa cómo están hechos, funcionan, evolucionan e interactúan los seres vivos: la célula, la herencia y la biodiversidad, además del impacto humano en los ecosistemas y el cuidado de los recursos naturales.",
    subareas: [
      {
        nombre: "La célula",
        reactivos: 12,
        temas: ["Estudio de la célula a través del tiempo", "Procesos celulares", "Ciclo celular, herencia y genética"],
        temario: ["Teoría celular y aportaciones científicas", "Tipos de célula y organelos", "Procesos metabólicos: respiración celular y fotosíntesis", "Funciones del ADN y del ARN; ácidos nucleicos", "Herencia mendeliana y no mendeliana", "Técnicas de ingeniería genética", "Mutaciones y ciclo celular"],
      },
      {
        nombre: "Biodiversidad",
        reactivos: 12,
        temas: ["Estudio de la diversidad biológica", "Seres vivos"],
        temario: ["Técnicas de estudio de la biodiversidad", "Mecanismos evolutivos", "Impacto humano en la biodiversidad", "Ecosistemas de México", "Relaciones interespecíficas", "Estructuras de plantas y animales", "Morfología del reino Fungi", "Tipos de reproducción y de adaptación", "Servicios ambientales"],
      },
    ],
    ejemploGuia: { paginas: "48", resumen: "Completar los productos de la respiración aerobia, de la fermentación de los hongos y de la fotosíntesis." },
    consejo: ["Dibuja la respiración y la fotosíntesis como un ciclo: lo que una produce, la otra lo consume.", "Haz cuadros de Punnett hasta que salgan sin pensar."],
    carreras: "Medicina, Biología, Enfermería, Nutrición, Agronomía, Veterinaria.",
    relacionadas: ["quimica", "premedicina", "ciencias-de-la-salud"],
    muestra: {
      enunciado: "Una planta de chícharo heterocigota de semilla amarilla (Aa) se cruza con una de semilla verde (aa). ¿Qué proporción de la descendencia tendrá semilla verde?",
      opciones: [
        { texto: "25 %", porque: "Es la proporción de una cruza Aa × Aa, no de Aa × aa." },
        { texto: "50 %", correcta: true, porque: "La cruza da Aa y aa en partes iguales; solo aa es verde." },
        { texto: "75 %", porque: "Confunde la proporción del fenotipo dominante en Aa × Aa." },
      ],
      explicacion: "Gametos: A y a de un lado, solo a del otro. Resultado: ½ Aa (amarilla) y ½ aa (verde).",
    },
  },
  {
    slug: "calculo-diferencial-e-integral",
    nombre: "Cálculo diferencial e integral",
    tipo: "especifico",
    icono: "SquareFunction",
    reactivos: 24,
    lema: "Límites, derivadas e integrales para describir el cambio.",
    definicion:
      "Evalúa los límites, la derivada y la integral, y cómo se relacionan por el teorema fundamental del cálculo, para resolver problemas teóricos y de fenómenos reales.",
    subareas: [
      {
        nombre: "Cálculo diferencial",
        reactivos: 12,
        temas: ["Límites", "La derivada", "Aplicaciones de la derivada"],
        temario: ["Propiedades de los límites", "Límites de funciones polinomiales", "Derivadas por definición, trigonométricas, exponenciales, logarítmicas y polinomiales", "Recta tangente de funciones algebraicas", "Velocidad instantánea, razón de cambio y optimización"],
      },
      {
        nombre: "Cálculo integral",
        reactivos: 12,
        temas: ["La integral", "Métodos de integración", "Aplicaciones de la integral definida"],
        temario: ["Partición de funciones", "Manipulación algebraica y aritmética", "Propiedades de la integral", "Métodos de integración", "Área, volumen y movimiento con integrales definidas"],
      },
    ],
    ejemploGuia: { paginas: "51", resumen: "Derivar dos funciones trigonométricas, evaluarlas en ángulos notables y sumar los resultados." },
    consejo: ["Memoriza la tabla de derivadas trigonométricas con sus signos: es donde más se falla.", "Aprende los valores de seno, coseno y tangente de 30°, 45° y 60°."],
    carreras: "Ingenierías, Física, Matemáticas, Actuaría, Arquitectura.",
    relacionadas: ["fisica", "pensamiento-matematico", "aritmetica"],
    muestra: {
      enunciado: "Si f(x) = 4x³ − 5x + 2, ¿cuánto vale f′(1)?",
      opciones: [
        { texto: "7", correcta: true, porque: "f′(x) = 12x² − 5, así que f′(1) = 12 − 5 = 7." },
        { texto: "1", porque: "Es f(1) = 4 − 5 + 2: evalúa la función sin derivarla." },
        { texto: "17", porque: "Cambia el signo del término −5x al derivar." },
      ],
      explicacion: "Regla de la potencia: d/dx (axⁿ) = n·a·xⁿ⁻¹. La constante 2 se anula.",
    },
  },
  {
    slug: "ciencias-de-la-salud",
    nombre: "Ciencias de la salud",
    tipo: "especifico",
    icono: "HeartPulse",
    reactivos: 24,
    lema: "Cómo se enferma una persona y cómo funciona su cuerpo.",
    definicion:
      "Evalúa la terminología de la salud, la historia natural de la enfermedad (agente, huésped y ambiente), la prevención de las enfermedades más comunes en México, las conductas de riesgo, los signos vitales y la anatomía y fisiología básicas.",
    subareas: [
      {
        nombre: "Estudio del proceso salud-enfermedad",
        reactivos: 11,
        temas: ["Terminología", "Triada ecológica", "Historia natural de la enfermedad", "Conductas de riesgo y parámetros fisiológicos"],
        temario: ["Términos técnicos de ciencias de la salud", "Triada ecológica y propagación de enfermedades", "Tipos y características de los agentes", "Niveles y medidas de prevención", "Trastornos alimentarios", "Signos vitales"],
      },
      {
        nombre: "Morfofisiología del cuerpo humano",
        reactivos: 13,
        temas: ["Sistemas de referencia anatómica", "Anatomía y fisiología de aparatos y sistemas"],
        temario: ["Planimetría", "Sistemas musculoesquelético, tegumentario, endócrino y nervioso", "Sistemas linfático e inmunológico", "Aparatos cardiovascular y respiratorio", "Aparatos digestivo, urinario y reproductor"],
      },
    ],
    ejemploGuia: { paginas: "54", resumen: "Dada la descripción de una bacteria y sus toxinas, decir qué elemento de la triada ecológica representa." },
    consejo: ["Aprende los rangos normales de los signos vitales: temperatura, presión, frecuencia cardiaca y respiratoria.", "Distingue bien los tres niveles de prevención con un ejemplo de cada uno."],
    carreras: "Enfermería, Nutrición, Odontología, Fisioterapia, Químico Farmacobiólogo.",
    relacionadas: ["premedicina", "biologia", "psicologia"],
    muestra: {
      enunciado: "Una campaña aplica la vacuna contra el sarampión a todos los niños de un municipio. ¿A qué nivel de prevención corresponde?",
      opciones: [
        { texto: "Primario", correcta: true, porque: "Actúa antes de que aparezca la enfermedad, en personas sanas." },
        { texto: "Secundario", porque: "Busca diagnóstico temprano y tratamiento oportuno cuando la enfermedad ya empezó." },
        { texto: "Terciario", porque: "Busca limitar el daño y rehabilitar cuando la enfermedad ya dejó secuelas." },
      ],
      explicacion: "La vacunación es protección específica: el ejemplo clásico de prevención primaria en el modelo de Leavell y Clark.",
    },
  },
  {
    slug: "derecho",
    nombre: "Derecho",
    tipo: "especifico",
    icono: "Scale",
    reactivos: 24,
    lema: "Las normas que ordenan la vida en sociedad.",
    definicion:
      "Evalúa la terminología jurídica, los tipos de normas de conducta, las fuentes del derecho y el proceso judicial, y cómo se aplica el derecho en lo laboral, civil, mercantil, constitucional, penal y administrativo.",
    subareas: [
      {
        nombre: "Nociones de derecho",
        reactivos: 10,
        temas: ["Acepciones", "Normas de conducta", "Fuentes del derecho", "Proceso jurisdiccional"],
        temario: ["Definición y significados del derecho (facultad, ciencia y norma)", "Acepciones: natural, vigente, positivo, objetivo y subjetivo", "Tipos de normas de conducta y sus sanciones", "Características de las normas jurídicas", "Fuentes del derecho", "Etapas y partes del proceso judicial"],
      },
      {
        nombre: "Ramas del derecho",
        reactivos: 14,
        temas: ["Laboral", "Civil", "Mercantil", "Constitucional", "Penal", "Administrativa"],
        temario: ["Sujetos del derecho laboral y condiciones de trabajo", "Figuras del derecho familiar", "Tipos de bienes y atributos de las personas físicas", "Sociedades mercantiles y títulos de crédito", "Derechos humanos, proceso legislativo y división de poderes", "Elementos del delito y bienes jurídicos tutelados", "Organización de la administración pública y funciones de las secretarías"],
      },
    ],
    ejemploGuia: { paginas: "57", resumen: "Identificar qué derecho humano limita al Estado para que respete las decisiones personales." },
    consejo: ["Relaciona cada rama con su ley principal: Ley Federal del Trabajo, Código Civil Federal, Código Nacional de Procedimientos Penales.", "Las normas jurídicas son bilaterales, heterónomas, externas y coercibles: compáralas con las morales."],
    carreras: "Derecho, Criminología, Ciencias políticas, Relaciones internacionales.",
    relacionadas: ["ciencias-sociales", "historia", "filosofia"],
    muestra: {
      enunciado: "Según la división de poderes en México, ¿qué poder discute y aprueba las leyes federales?",
      opciones: [
        { texto: "Legislativo", correcta: true, porque: "El Congreso de la Unión, con sus dos cámaras, discute y aprueba las leyes." },
        { texto: "Ejecutivo", porque: "Puede presentar iniciativas y promulga las leyes, pero no las aprueba." },
        { texto: "Judicial", porque: "Interpreta y aplica las leyes al resolver controversias." },
      ],
      explicacion: "El proceso legislativo: iniciativa, discusión, aprobación (Congreso), sanción, publicación e inicio de vigencia (Ejecutivo).",
    },
  },
  {
    slug: "economia",
    nombre: "Economía",
    tipo: "especifico",
    icono: "ChartLine",
    reactivos: 24,
    lema: "Cómo decide una sociedad qué producir y para quién.",
    definicion:
      "Evalúa los conceptos básicos de la economía desde las distintas escuelas de pensamiento, y los elementos de la microeconomía y la macroeconomía para relacionarlos con el entorno.",
    subareas: [
      {
        nombre: "Principios de economía",
        reactivos: 10,
        temas: ["Elementos básicos de la economía", "Escuelas del pensamiento económico"],
        temario: ["Campos de estudio, conceptos y subdivisiones", "Actividades económicas y etapas del proceso económico", "Factores de producción y agentes económicos", "Tipos de sistemas económicos", "Escuelas: mercantilista, fisiócrata, clásica, neoclásica, marxista y keynesiana"],
      },
      {
        nombre: "Microeconomía y macroeconomía",
        reactivos: 14,
        temas: ["Oferta y demanda", "Competencia", "Teorías del consumidor y del productor", "Indicadores macroeconómicos", "Ciclo económico", "Políticas económicas", "Globalización y bloques comerciales"],
        temario: ["Leyes de la oferta y la demanda", "Competencia perfecta e imperfecta", "Comportamiento del consumidor y teoría del productor", "Cálculo de variables e indicadores", "Fases del ciclo económico", "Política fiscal y política monetaria", "Globalización y bloques comerciales"],
      },
    ],
    ejemploGuia: { paginas: "60", resumen: "Distinguir de dónde viene la ganancia del capitalista según la escuela marxista frente a la clásica." },
    consejo: ["Distingue «cambio en la cantidad demandada» (moverse sobre la curva) de «cambio en la demanda» (mover la curva).", "Haz una línea del tiempo de las escuelas con un autor y una idea clave de cada una."],
    carreras: "Economía, Finanzas, Comercio internacional, Administración.",
    relacionadas: ["administracion", "matematicas-financieras", "ciencias-sociales"],
    muestra: {
      enunciado: "Si el precio del café sube y todo lo demás permanece igual, ¿qué ocurre?",
      opciones: [
        { texto: "Disminuye la cantidad demandada de café", correcta: true, porque: "Ley de la demanda: a mayor precio, menor cantidad demandada." },
        { texto: "Aumenta la cantidad demandada de café", porque: "Contradice la ley de la demanda para un bien normal." },
        { texto: "La curva de demanda se desplaza a la derecha", porque: "Un cambio en el precio del propio bien mueve el punto sobre la curva; no la desplaza." },
      ],
      explicacion: "«Todo lo demás igual» (ceteris paribus) aísla el efecto del precio: movimiento a lo largo de la curva.",
    },
  },
  {
    slug: "filosofia",
    nombre: "Filosofía",
    tipo: "especifico",
    icono: "Landmark",
    reactivos: 24,
    lema: "Preguntarse por la realidad, el ser humano y la vida buena.",
    definicion:
      "Evalúa los fundamentos de la filosofía, lo que caracteriza a este tipo de pensamiento y su relación con el contexto, y cómo se aborda la realidad con herramientas filosóficas, incluida la filosofía en México.",
    subareas: [
      {
        nombre: "Fundamentos",
        reactivos: 10,
        temas: ["Origen de la filosofía", "Sentido de la vida como problema filosófico", "Filosofía mexicana"],
        temario: ["La duda, el asombro y la pregunta filosófica en los presocráticos", "El saber filosófico y sus ramas", "Aportaciones de la filosofía clásica", "Naturaleza humana, buena vida y cuidado de sí", "Postulados sobre la justicia", "Corrientes filosóficas en México en el siglo XIX y grupos del siglo XX"],
      },
      {
        nombre: "Quehacer filosófico",
        reactivos: 14,
        temas: ["Problemas contemporáneos", "Conocimiento de sí mismo y relación con otros", "Identidad nacional"],
        temario: ["Tipos de discriminación y discursos culturales contemporáneos", "Corrientes y posturas filosóficas", "Principios bioéticos", "Problemas filosóficos de las nuevas tecnologías", "Tipos de racionalidad y globalización", "Condición humana y dimensiones del ser humano", "Cosmovisión prehispánica, identidad del mexicano, multiculturalidad y nacionalismo"],
      },
    ],
    ejemploGuia: { paginas: "63", resumen: "Reconocer qué actitud llevó a los primeros filósofos griegos a buscar el principio de la naturaleza más allá del mito." },
    consejo: ["Asocia cada presocrático con su arjé: Tales (agua), Anaxímenes (aire), Heráclito (fuego).", "Los cuatro principios bioéticos (autonomía, beneficencia, no maleficencia y justicia) aparecen seguido."],
    carreras: "Filosofía, Humanidades, Derecho, Ciencias de la educación.",
    relacionadas: ["historia", "literatura", "ciencias-sociales"],
    muestra: {
      enunciado: "¿Qué rama de la filosofía estudia lo que está bien o mal en la conducta humana?",
      opciones: [
        { texto: "Ética", correcta: true, porque: "Reflexiona sobre la moral, el deber y la vida buena." },
        { texto: "Epistemología", porque: "Estudia el conocimiento: su origen, alcance y validez." },
        { texto: "Estética", porque: "Estudia la belleza y la experiencia del arte." },
      ],
      explicacion: "Ética = acción; epistemología = conocimiento; estética = belleza; ontología = ser; lógica = razonamiento válido.",
    },
  },
  {
    slug: "fisica",
    nombre: "Física",
    tipo: "especifico",
    icono: "Atom",
    reactivos: 24,
    lema: "Fuerzas, movimiento, ondas y campos.",
    definicion:
      "Evalúa conceptos, leyes y teorías para explicar fenómenos de estática, cantidad de movimiento, dinámica rotacional, electromagnetismo, movimiento ondulatorio y óptica.",
    subareas: [
      {
        nombre: "Mecánica",
        reactivos: 10,
        temas: ["Sistemas de fuerza", "Aceleración y fuerza centrípeta", "Trabajo y energía cinética rotacional", "Momento angular", "Impulso y cantidad de movimiento"],
        temario: ["Fuerzas coplanares concurrentes y distribuidas", "Movimiento circular uniforme y fuerza centrípeta", "Trabajo rotacional y energía cinética rotacional", "Conservación del momento angular", "Conservación de la cantidad de movimiento", "Tipos de choque"],
      },
      {
        nombre: "Óptica, ondas y electromagnetismo",
        reactivos: 14,
        temas: ["Campos y fuerza magnética", "Aplicaciones del electromagnetismo", "Movimiento armónico simple", "Ondas y fenómenos ondulatorios", "Ondas electromagnéticas", "Óptica geométrica y ondulatoria", "Reflexión y refracción"],
        temario: ["Interacción de objetos por campos magnéticos", "Fuerza magnética y fuerzas entre corrientes", "Conductores que generan campos magnéticos", "Movimiento armónico simple", "Clasificación y gráficas de ondas", "Aplicaciones tecnológicas de las ondas", "Tipos de lente y fenómenos ópticos"],
      },
    ],
    ejemploGuia: { paginas: "66", resumen: "Calcular la rapidez angular de un objeto que gira atado a una cuerda, a partir de su momento angular, masa y radio." },
    consejo: ["Revisa siempre las unidades: muchas opciones falsas tienen el número bien y la magnitud mal.", "Distingue momento lineal (p = mv) de momento angular (L = Iω)."],
    carreras: "Ingenierías, Física, Arquitectura, Electrónica.",
    relacionadas: ["calculo-diferencial-e-integral", "ciencias-experimentales", "quimica"],
    muestra: {
      enunciado: "Un auto de 1 000 kg viaja a 20 m/s. ¿Cuál es la magnitud de su cantidad de movimiento?",
      opciones: [
        { texto: "20 000 kg·m/s", correcta: true, porque: "p = m·v = 1 000 × 20." },
        { texto: "50 kg·m/s", porque: "Divide la masa entre la velocidad." },
        { texto: "200 000 kg·m/s", porque: "Calcula ½mv², que es la energía cinética (en joules), no la cantidad de movimiento." },
      ],
      explicacion: "La cantidad de movimiento es lineal en la velocidad; la energía cinética es cuadrática. No las confundas.",
    },
  },
  {
    slug: "historia",
    nombre: "Historia",
    tipo: "especifico",
    icono: "Hourglass",
    reactivos: 24,
    lema: "Procesos de México y del mundo para entender el presente.",
    definicion:
      "Evalúa acontecimientos y procesos políticos, económicos, sociales y culturales de la historia de México y de la historia universal, para comprender cómo se transforman las sociedades.",
    subareas: [
      {
        nombre: "Historia de México",
        reactivos: 14,
        temas: ["México prehispánico", "Virreinato e independencia", "México independiente hasta la Reforma (1821-1876)", "Porfiriato y Revolución", "México posrevolucionario (1920-1940)", "México actual (1940 a la fecha)"],
        temario: ["Poblamiento de América y áreas culturales prehispánicas", "Instituciones novohispanas", "Causas y consecuencias de la independencia", "Proyectos de nación y legislaciones del siglo XIX", "Intervenciones extranjeras", "Porfiriato y Revolución mexicana", "Gobiernos posrevolucionarios", "Desarrollo económico de 1940 a 1982", "Movimientos sociales de 1968 a 2000 y transición democrática"],
      },
      {
        nombre: "Historia universal",
        reactivos: 10,
        temas: ["Imperialismo y expansión colonial (1870-1914)", "Primera Guerra Mundial", "Segunda Guerra Mundial", "Descolonización y Guerra Fría", "Globalización y neoliberalismo"],
        temario: ["Política imperialista y dominio colonial", "Causas y consecuencias de las dos guerras mundiales", "Proceso de descolonización", "Guerra Fría (1945-1991)", "Globalización desde la segunda mitad del siglo XX", "Consecuencias del neoliberalismo"],
      },
    ],
    ejemploGuia: { paginas: "70", resumen: "Identificar un movimiento social de fines del siglo XX a partir de sus demandas de autonomía y derechos." },
    consejo: ["Estudia por causas y consecuencias, no por fechas sueltas: así vienen las preguntas.", "Haz una línea del tiempo de México con una sola frase por periodo."],
    carreras: "Historia, Derecho, Ciencias políticas, Sociología, Antropología.",
    relacionadas: ["ciencias-sociales", "filosofia", "literatura"],
    muestra: {
      enunciado: "¿Qué constitución dedicó su primer título a los derechos del hombre y se volvió bandera de los liberales durante la Guerra de Reforma?",
      opciones: [
        { texto: "La Constitución de 1824", porque: "Estableció la república federal, pero no tenía un catálogo de derechos y mantuvo la religión católica como oficial." },
        { texto: "La Constitución de 1857", correcta: true, porque: "Abrió con el título «De los derechos del hombre» y su defensa enfrentó a liberales y conservadores." },
        { texto: "El Plan de Ayutla", porque: "Fue el plan de 1854 que desconoció a Santa Anna; no es una constitución." },
      ],
      explicacion: "La Guerra de Reforma (1858-1861) estalló cuando los conservadores rechazaron la Constitución de 1857.",
    },
  },
  {
    slug: "literatura",
    nombre: "Literatura",
    tipo: "especifico",
    icono: "Feather",
    reactivos: 24,
    lema: "Épocas, corrientes y géneros de la obra literaria.",
    definicion:
      "Evalúa si reconoces el género, la época y las formas de un texto por sus rasgos, y si distingues la evolución de la lírica, el teatro antiguo y moderno, el ensayo y la literatura contemporánea y emergente.",
    subareas: [
      {
        nombre: "Ubicación espacio-temporal de la obra literaria",
        reactivos: 10,
        temas: ["Antigüedad y Medievo", "Renacimiento, Siglos de Oro y Neoclasicismo", "Romanticismo y Realismo", "Vanguardismo", "Literatura contemporánea y emergente"],
        temario: ["Literatura griega y romana", "Tradiciones literarias medievales", "Renacimiento y Neoclasicismo", "Romanticismo y Realismo", "Vanguardias: surrealismo, dadaísmo y futurismo", "Existencialismo, teatro del absurdo, Contemporáneos y boom latinoamericano", "Literatura emergente"],
      },
      {
        nombre: "Géneros literarios y sus elementos",
        reactivos: 14,
        temas: ["Narrativo", "Lírico", "Dramático", "Ensayo literario"],
        temario: ["Narrativa: subgéneros y elementos estructurales", "Lírica: lenguaje connotativo y denotativo, figuras retóricas", "Teatro: subgéneros y elementos", "Ensayo: estructura, tesis, postura, hecho y opinión"],
      },
    ],
    ejemploGuia: { paginas: "74", resumen: "Elegir, entre tres obras clásicas, la que pertenece a la literatura romana." },
    consejo: ["Arma una tabla corriente → rasgos → dos autores → una obra.", "Practica identificar figuras retóricas en poemas cortos."],
    carreras: "Letras, Comunicación, Periodismo, Humanidades.",
    relacionadas: ["comprension-lectora", "redaccion-indirecta", "historia"],
    muestra: {
      enunciado: "¿Qué corriente literaria privilegia la emoción, la libertad creadora y la exaltación del yo frente a las reglas del neoclasicismo?",
      opciones: [
        { texto: "Realismo", porque: "Busca retratar la sociedad con objetividad y detalle, no exaltar al yo." },
        { texto: "Romanticismo", correcta: true, porque: "Rompe con la norma neoclásica y pone en el centro el sentimiento y la individualidad." },
        { texto: "Neoclasicismo", porque: "Es justo la corriente contra la que reacciona: razón, orden y modelos clásicos." },
      ],
      explicacion: "Neoclasicismo (razón) → Romanticismo (emoción) → Realismo (observación de la sociedad).",
    },
  },
  {
    slug: "matematicas-financieras",
    nombre: "Matemáticas financieras",
    tipo: "especifico",
    icono: "PiggyBank",
    reactivos: 24,
    lema: "Porcentajes, descuentos e interés para decidir con tu dinero.",
    definicion:
      "Evalúa las operaciones financieras básicas (razones, porcentajes, proporciones, descuentos, sucesiones y series), el interés simple y la amortización, para calcular monto, capital, tasa, interés y tiempo.",
    subareas: [
      {
        nombre: "Elementos financieros básicos",
        reactivos: 14,
        temas: ["Razones", "Proporciones directas e inversas", "Porcentajes", "Descuentos", "Sucesiones y series"],
        temario: ["Razón geométrica y razón aritmética", "Proporcionalidad directa e inversa en finanzas", "Cantidad inicial y final, incremento y decremento", "Precio inicial, porcentaje de descuento y precio final", "Términos, diferencias y valores faltantes de sucesiones"],
      },
      {
        nombre: "Interés simple",
        reactivos: 10,
        temas: ["Elementos de interés simple y amortización", "Inversiones"],
        temario: ["Elementos del interés simple", "Saldo insoluto", "Tasa y periodo de interés", "Monto, tiempo y capital de inversión"],
      },
    ],
    ejemploGuia: { paginas: "77", resumen: "Calcular cuánto se pagó en total por un auto con enganche y un interés anual sobre lo que se financió." },
    consejo: ["Iguala unidades: tasa anual con tiempo en años, tasa mensual con meses.", "Distingue interés (lo que se gana o paga) de monto (capital + interés)."],
    carreras: "Contaduría, Finanzas, Administración, Economía, Actuaría.",
    relacionadas: ["aritmetica", "economia", "administracion"],
    muestra: {
      enunciado: "¿Qué interés simple genera un capital de $8 000 al 12 % anual durante 9 meses?",
      opciones: [
        { texto: "$720", correcta: true, porque: "I = C·i·t = 8 000 × 0.12 × 0.75 = 720." },
        { texto: "$960", porque: "Calcula un año completo y olvida convertir los 9 meses." },
        { texto: "$8 720", porque: "Es el monto (capital + interés), no el interés." },
      ],
      explicacion: "Convierte 9 meses a años: 9/12 = 0.75. Luego I = C × i × t.",
    },
  },
  {
    slug: "premedicina",
    nombre: "Premedicina",
    tipo: "especifico",
    icono: "Stethoscope",
    reactivos: 48,
    lema: "Salud pública, anatomía, célula y bioquímica en un solo módulo.",
    definicion:
      "Evalúa el proceso salud-enfermedad desde la salud pública hasta el organismo y sus niveles de organización: órganos, tejidos, células y moléculas, y los procesos vitales que ocurren en ellos. Tiene 48 reactivos y no se combina con otro módulo.",
    subareas: [
      {
        nombre: "Salud pública y medicina comunitaria",
        reactivos: 10,
        temas: ["Concepto de salud y enfermedad", "Triada ecológica", "Historia natural de la enfermedad", "Signos y síntomas"],
        temario: ["Concepto de salud y enfermedad", "Triada ecológica y cadena epidemiológica", "Tipos de agente causal", "Periodos de la historia natural y niveles de prevención (Leavell y Clark)", "Signos y síntomas: datos clínicos y sus parámetros"],
      },
      {
        nombre: "Anatomía y fisiología",
        reactivos: 18,
        temas: ["Niveles de organización y divisiones anatómicas", "Sistemas nervioso, endócrino, inmunológico, linfático, tegumentario y musculoesquelético", "Aparatos digestivo, cardiovascular, respiratorio, urinario y reproductor"],
        temario: ["Planos y términos anatómicos", "Sistema nervioso y función de las hormonas", "Componentes y tipos de respuesta inmune", "Sistemas linfático, tegumentario y musculoesquelético", "Aparatos cardiovascular y respiratorio", "Aparato digestivo y etapas de la digestión", "Aparatos urinario y reproductor"],
      },
      {
        nombre: "Biología celular y microbiología",
        reactivos: 10,
        temas: ["Organelos celulares", "Metabolismo y respiración celular", "Genética y herencia", "Microbiología y parasitología médica"],
        temario: ["Estructura, función y tipos de células", "Reacciones metabólicas, glucólisis y ciclo de Krebs", "Síndromes y enfermedades hereditarias", "Material genético humano", "Morfología de hongos, parásitos, virus y bacterias"],
      },
      {
        nombre: "Bioquímica y biología molecular",
        reactivos: 10,
        temas: ["Transporte membranal", "Biomoléculas", "Farmacología"],
        temario: ["Componentes de la membrana y tipos de transporte", "Carbohidratos, lípidos, proteínas y vitaminas", "Grupos farmacológicos y vías de administración", "Ramas de la farmacología", "Soluciones y gradiente de concentración"],
      },
    ],
    ejemploGuia: { paginas: "82", resumen: "Con tres signos vitales de un paciente, identificar cuál está fuera de lo normal." },
    consejo: ["Anatomía y fisiología vale 18 de 48: empieza por ahí.", "Como Premedicina vale el doble, tu puntaje global sale de cuatro áreas y no de cinco."],
    carreras: "Medicina y otras carreras de la salud en universidades que eligen este módulo.",
    relacionadas: ["biologia", "quimica", "ciencias-de-la-salud"],
    muestra: {
      enunciado: "En una célula eucariota, ¿dónde ocurre el ciclo de Krebs?",
      opciones: [
        { texto: "En el citoplasma", porque: "Ahí ocurre la glucólisis, el paso anterior." },
        { texto: "En la matriz mitocondrial", correcta: true, porque: "El piruvato entra a la mitocondria y el ciclo se lleva a cabo en su matriz." },
        { texto: "En los ribosomas", porque: "Los ribosomas sintetizan proteínas; no participan en la respiración celular." },
      ],
      explicacion: "Glucólisis (citoplasma) → ciclo de Krebs (matriz mitocondrial) → cadena respiratoria (membrana mitocondrial interna).",
    },
  },
  {
    slug: "probabilidad-y-estadistica",
    nombre: "Probabilidad y estadística",
    tipo: "especifico",
    icono: "Dices",
    reactivos: 24,
    lema: "Organizar datos y medir la incertidumbre.",
    definicion:
      "Evalúa cómo organizar, representar y describir datos con frecuencias, gráficas y medidas, y cómo calcular probabilidades con técnicas de conteo y distribuciones para leer reportes con datos.",
    subareas: [
      {
        nombre: "Estadística",
        reactivos: 12,
        temas: ["Población, muestra y tipos de variables", "Frecuencias y sus representaciones", "Medidas descriptivas"],
        temario: ["Población y muestra", "Tipos de variables", "Frecuencia absoluta, relativa, acumulada y porcentual", "Gráficas y tablas de frecuencias", "Media, moda y mediana", "Varianza y desviación estándar", "Percentiles"],
      },
      {
        nombre: "Probabilidad",
        reactivos: 12,
        temas: ["Conjuntos y eventos", "Cálculo de la probabilidad", "Distribuciones"],
        temario: ["Cardinalidad del espacio muestral", "Teoría de conjuntos", "Permutaciones, ordenaciones y variaciones", "Axiomas de probabilidad", "Técnicas de conteo", "Tipos y cálculo de distribuciones"],
      },
    ],
    ejemploGuia: { paginas: "85", resumen: "Calcular la media de una lista de once datos, con distractores que confunden media y mediana." },
    consejo: ["Media, mediana y moda se confunden a propósito en las opciones: calcula las tres.", "Antes de una probabilidad, escribe el espacio muestral completo."],
    carreras: "Actuaría, Economía, Psicología, Ingenierías, Ciencias sociales.",
    relacionadas: ["pensamiento-matematico", "aritmetica", "economia"],
    muestra: {
      enunciado: "Se lanza un dado justo de seis caras. ¿Cuál es la probabilidad de obtener un número mayor que 4?",
      opciones: [
        { texto: "1/3", correcta: true, porque: "Casos favorables: 5 y 6. 2/6 = 1/3." },
        { texto: "1/2", porque: "Incluye el 4, pero «mayor que 4» no lo incluye." },
        { texto: "2/3", porque: "Es la probabilidad del evento contrario (4 o menos)." },
      ],
      explicacion: "P = casos favorables / casos posibles. «Mayor que» no incluye el número.",
    },
  },
  {
    slug: "psicologia",
    nombre: "Psicología",
    tipo: "especifico",
    icono: "Brain",
    reactivos: 24,
    lema: "La conducta humana, de la neurona a la personalidad.",
    definicion:
      "Evalúa las corrientes de la psicología y sus aportaciones, la estructura del sistema nervioso y el papel de neuronas y hormonas, y los procesos psicológicos y factores que explican el comportamiento.",
    subareas: [
      {
        nombre: "Bases biopsicosociales de la conducta",
        reactivos: 14,
        temas: ["Sistema nervioso y endócrino", "Procesos psicológicos", "Motivación, emoción y personalidad"],
        temario: ["Sistema nervioso central y periférico", "Estructura y funciones de las neuronas", "Glándulas y hormonas", "Tipos de memoria, atención, aprendizaje y pensamiento", "Teorías de la personalidad: Erikson, Rogers, Maslow y Allport", "Tipos de motivación y componentes de la emoción"],
      },
      {
        nombre: "Aportaciones de la psicología",
        reactivos: 10,
        temas: ["Etapa precientífica", "Corrientes psicológicas", "Áreas de especialización"],
        temario: ["Objetivos y características científicas de la psicología", "Filósofos y sus aportaciones", "Premisas de las corrientes", "Condicionamiento clásico y operante", "Teorías del desarrollo de Freud y Piaget", "Funciones del psicólogo por área"],
      },
    ],
    ejemploGuia: { paginas: "88", resumen: "Identificar el tipo de memoria que usa una persona al recordar sus cumpleaños de la infancia." },
    consejo: ["Haz fichas de cada autor con su teoría y sus etapas (Freud, Piaget, Erikson).", "Clásico = estímulo → respuesta; operante = conducta → consecuencia."],
    carreras: "Psicología, Pedagogía, Trabajo social, Ciencias de la educación.",
    relacionadas: ["ciencias-de-la-salud", "ciencias-sociales", "filosofia"],
    muestra: {
      enunciado: "Un perro comienza a salivar al oír una campana que antes sonaba siempre justo antes de darle comida. ¿Qué tipo de aprendizaje es?",
      opciones: [
        { texto: "Condicionamiento clásico", correcta: true, porque: "Un estímulo neutro (campana) se asocia con uno incondicionado (comida) y termina provocando la respuesta." },
        { texto: "Condicionamiento operante", porque: "Ahí la conducta cambia por sus consecuencias (premios o castigos)." },
        { texto: "Aprendizaje por observación", porque: "Se aprende viendo a otros; aquí no hay un modelo que imitar." },
      ],
      explicacion: "Es el experimento clásico de Pavlov: asociación entre estímulos, no entre conducta y consecuencia.",
    },
  },
  {
    slug: "quimica",
    nombre: "Química",
    tipo: "especifico",
    icono: "FlaskConical",
    reactivos: 24,
    lema: "Enlaces, reacciones y la química del carbono.",
    definicion:
      "Evalúa los enlaces y la electronegatividad, las soluciones, el balanceo de ecuaciones, la estequiometría y las reacciones, además de la química orgánica: el carbono, los hidrocarburos, los grupos funcionales y los enlaces de las biomoléculas.",
    subareas: [
      {
        nombre: "Fundamentos generales",
        reactivos: 14,
        temas: ["Enlaces químicos y electronegatividad", "Soluciones", "Balanceo de ecuaciones", "Estequiometría", "Reacciones químicas"],
        temario: ["Tipos de enlace y diferencia de electronegatividad", "Soluciones: porcentaje, ppm y molaridad", "Tipos de reacciones y coeficientes", "Ecuaciones de situaciones experimentales", "Relaciones estequiométricas, gramos y moles", "Procesos endotérmicos y exotérmicos, entalpía", "Constante de equilibrio"],
      },
      {
        nombre: "Química orgánica",
        reactivos: 10,
        temas: ["Átomo de carbono", "Hidrocarburos", "Grupos funcionales", "Enlaces glucosídico y peptídico"],
        temario: ["Propiedades del átomo de carbono", "Estructura y geometría de alcanos, alquenos y alquinos", "Nomenclatura IUPAC", "Grupos funcionales", "Carbohidratos y aminoácidos", "Enlaces glucosídico y peptídico"],
      },
    ],
    ejemploGuia: { paginas: "92", resumen: "Clasificar una reacción entre un metal y una sal (sustitución simple, doble sustitución o análisis)." },
    consejo: ["Memoriza los cortes de electronegatividad: menos de 0.4 no polar, 0.4 a 1.7 polar, más de 1.7 iónico.", "Balancea primero metales, luego no metales, al final H y O."],
    carreras: "Medicina, Química, Ingeniería química, Farmacia, Alimentos.",
    relacionadas: ["biologia", "premedicina", "ciencias-experimentales"],
    muestra: {
      enunciado: "El sodio tiene electronegatividad 0.9 y el cloro 3.0. ¿Qué tipo de enlace forman en el NaCl?",
      opciones: [
        { texto: "Iónico", correcta: true, porque: "La diferencia es 2.1, mayor que 1.7: hay transferencia de electrones." },
        { texto: "Covalente polar", porque: "Corresponde a diferencias entre 0.4 y 1.7, con electrones compartidos de forma desigual." },
        { texto: "Covalente no polar", porque: "Corresponde a diferencias menores de 0.4, como en el Cl₂." },
      ],
      explicacion: "Resta las electronegatividades: 3.0 − 0.9 = 2.1. Con más de 1.7 el enlace se considera iónico.",
    },
  },
  {
    slug: "ciencias-experimentales",
    nombre: "Ciencias experimentales",
    tipo: "general",
    icono: "Microscope",
    reactivos: 24,
    lema: "Química, física y biología en un módulo general.",
    definicion:
      "Evalúa teorías, leyes y conceptos de química, física y biología, y los métodos para resolver problemas cuidando la salud, el ambiente y el uso responsable de los recursos.",
    subareas: [
      {
        nombre: "Química",
        reactivos: 8,
        temas: ["Estructura y cambios de la materia", "Lenguaje químico inorgánico", "Cuantificación en las reacciones", "Compuestos del carbono y macromoléculas"],
        temario: ["Configuración de los elementos y cambios de estado", "Tipos de reacciones y ecuaciones", "Reactivo limitante y rendimiento", "Macromoléculas y nomenclatura IUPAC"],
      },
      {
        nombre: "Física",
        reactivos: 8,
        temas: ["Cinemática", "Dinámica", "Termología", "Electricidad y magnetismo"],
        temario: ["Movimiento rectilíneo uniforme y uniformemente acelerado", "Distancia, velocidad, aceleración y tiempo", "Leyes de Newton", "Equilibrio térmico, capacidad calorífica y calor específico", "Ley de Coulomb, ley de Ohm, carga y campo eléctrico"],
      },
      {
        nombre: "Biología",
        reactivos: 8,
        temas: ["Estructura y metabolismo celular", "Sistemas de integración y regulación", "Genética", "Evolución y diversidad"],
        temario: ["Estructuras, funciones y metabolismo celular", "Sistemas nervioso, endócrino y reproductivo", "Herencia e ingeniería genética", "Teorías evolutivas y cuidado de la biodiversidad"],
      },
    ],
    ejemploGuia: { paginas: "95", resumen: "Elegir, entre tres situaciones de un spa, aquella donde se alcanza el equilibrio térmico." },
    consejo: ["Son solo 8 preguntas por ciencia: repasa lo esencial de cada una, no lo profundo de una sola.", "Ten a la mano las fórmulas del MRUA y la ley de Ohm."],
    carreras: "Universidades donde eliges varias carreras de ciencias o ingeniería en orden de preferencia.",
    relacionadas: ["fisica", "quimica", "biologia"],
    muestra: {
      enunciado: "Una ciclista parte del reposo y acelera a 2 m/s² durante 5 s. ¿Qué velocidad alcanza?",
      opciones: [
        { texto: "10 m/s", correcta: true, porque: "v = v₀ + a·t = 0 + 2 × 5." },
        { texto: "25 m/s", porque: "Es la distancia recorrida, d = ½·a·t² = 25 m, no la velocidad." },
        { texto: "2.5 m/s", porque: "Divide el tiempo entre la aceleración." },
      ],
      explicacion: "En MRUA desde el reposo, la velocidad crece a·t y la distancia ½·a·t².",
    },
  },
  {
    slug: "ciencias-sociales",
    nombre: "Ciencias sociales",
    tipo: "general",
    icono: "UsersRound",
    reactivos: 24,
    lema: "Cómo se construye el conocimiento sobre la sociedad.",
    definicion:
      "Evalúa las disciplinas sociales, los procesos históricos que les dieron origen, los conceptos y fenómenos sociales actuales y su análisis dentro del entorno.",
    subareas: [
      {
        nombre: "Construcción del conocimiento",
        reactivos: 12,
        temas: ["Tipos de conocimiento", "Acontecimientos históricos e ideologías", "Objeto de estudio de las ciencias", "Interpretaciones científicas"],
        temario: ["Conocimiento intuitivo, empírico, religioso, filosófico y científico", "Revolución Científica, Revolución Industrial y Revolución francesa", "Ilustración, racionalismo, empirismo y evolucionismo", "Objeto de la antropología, ciencia política, derecho, economía, geografía, historia, psicología y sociología", "Positivismo, materialismo histórico, estructural funcionalismo, teoría comprensiva y teoría crítica"],
      },
      {
        nombre: "Estudio de los fenómenos sociales",
        reactivos: 12,
        temas: ["Socialización", "El ser social en su entorno", "Categorías y fenómenos sociales", "Instituciones del Estado mexicano"],
        temario: ["Ser social, ser individual, acción social e individual", "Acción con arreglo a fines y a valores", "Socialización primaria, secundaria y resocialización", "Entornos familiar, educativo, laboral, cultural e histórico", "Clase, grupo, proceso y práctica social", "Transvaloración, derechos humanos, discriminación y migración", "Instituciones del Estado mexicano"],
      },
    ],
    ejemploGuia: { paginas: "98", resumen: "Identificar el tipo de socialización en una escena escolar con niños de primaria." },
    consejo: ["Asocia cada interpretación con su autor: Comte, Marx, Durkheim/Parsons, Weber, Escuela de Fráncfort.", "Para cada fenómeno social, ten un ejemplo de México."],
    carreras: "Universidades donde eliges varias carreras sociales o humanidades en orden de preferencia.",
    relacionadas: ["historia", "derecho", "economia"],
    muestra: {
      enunciado: "¿Qué tipo de conocimiento se basa en la experiencia cotidiana, sin un método sistemático ni comprobación rigurosa?",
      opciones: [
        { texto: "Empírico", correcta: true, porque: "Se obtiene de la práctica y la observación del día a día." },
        { texto: "Científico", porque: "Usa un método sistemático, verificable y metódico." },
        { texto: "Filosófico", porque: "Se basa en la reflexión racional sobre problemas generales, no en la experiencia cotidiana." },
      ],
      explicacion: "Lo que distingue al conocimiento científico del empírico es el método, no el tema.",
    },
  },
];

export const areaPorSlug = (slug: string) => AREAS.find((a) => a.slug === slug);
