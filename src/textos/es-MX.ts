/**
 * Catálogo de textos de interfaz (RNF-09, RNF-22): «tú», tono de entrenador,
 * frases cortas y humor ligero en los errores, nunca burla.
 */
export const t = {
  marca: { nombre: "Estudiar es Clave", corto: "Clave", lema: "Tu consultorio para el examen de admisión." },
  aviso: {
    estimacion: "Estimación propia de Estudiar es Clave; no es un puntaje del CENEVAL.",
    sinValidar: "Banco en modo desarrollo: reactivos aún sin validar por un docente.",
  },
  nav: { inicio: "Inicio", diagnostico: "Diagnóstico", practica: "Dosis diaria", avance: "Avance", liga: "Liga", planes: "Planes", cuenta: "Cuenta", entrar: "Entrar", admin: "Admin" },
  niveles: { Dominas: "Dominas", "En desarrollo": "En desarrollo", "Área de oportunidad": "Área de oportunidad", na: "Datos insuficientes" },
  practica: {
    aciertos: ["¡Eso! Diagnóstico certero.", "Correcto. Así se lee un caso.", "Bien visto. Siguiente paciente.", "Exacto. Pulso firme."],
    errores: [
      "Casi. Este distractor engaña a muchos.",
      "No era esa, pero ahora ya sabes por qué.",
      "Falla de lectura, no de capacidad. Revisa el porqué.",
      "Ups. Mejor equivocarte aquí que el día del examen.",
    ],
  },
  muro: {
    pase: "Incluido en el pase",
    familia: "Pídeselo a tu familia",
    seguirGratis: "Seguir con el plan gratis",
  },
  errores: {
    generico: "Algo falló de nuestro lado. Tus respuestas están a salvo; intenta de nuevo.",
    sinRed: "Sin señal. Guardamos tus respuestas en el teléfono y las mandamos al volver la red.",
  },
} as const;
