# Banco semilla — Ruta Medicina BUAP (v1.0.0)

Archivo: `banco-semilla-medicina.json` (JSON en UTF-8, listo para `fetch()` en la web o para importarse a una base de datos).

- **93 reactivos originales**, cada uno con 3 opciones y la argumentación de cada opción.
- **5 textos base**: artículo de opinión, ensayo, cuento, poema y convocatoria.
- **87 tipos de error** catalogados.
- **1 plantilla de diagnóstico.**

Todo el contenido es de autoría propia: no reproduce reactivos del CENEVAL ni ejercicios de libros.

## Distribución (proporcional al examen real)

| Área | Subárea | En el banco | En el examen |
|---|---|---|---|
| Comprensión lectora | Estudio / Literario / Participación social | 6 / 6 / 3 | 12 / 12 / 6 |
| Redacción indirecta | Estudio / Participación social | 8 / 7 | 15 / 15 |
| Pensamiento matemático | Comprensión de lo matemático / Matematización | 9 / 6 | 18 / 12 |
| Biología | La célula / Biodiversidad | 6 / 6 | 12 / 12 |
| Química | Fundamentos / Orgánica | 7 / 5 | 14 / 10 |
| Premedicina | Salud pública / Anatomía / Biol. celular / Bioquímica | 5 / 9 / 5 / 5 | 10 / 18 / 10 / 10 |

La respuesta correcta está repartida en partes iguales entre A, B y C (31 cada una). Dificultad estimada: 26 fáciles, 58 medias y 9 difíciles.

## Estructura del archivo

```
{
  meta        → nombre, versión, fecha, estado general
  taxonomia   → área → subáreas (con reactivos_examen = peso oficial) → temas
  errores     → [{id, area, descripcion, recomendacion}]
  textos      → [{id, ambito, tipo_texto, titulo, parrafos | versos, autoria}]
  reactivos   → [ ...ver abajo... ]
  plantillas  → [{id, nombre, reactivos[], tiempo_limite_min, umbrales, minimo_reactivos_para_reportar}]
}
```

### Campos de cada reactivo

| Campo | Ejemplo | Uso en la web |
|---|---|---|
| `id`, `version` | `"PM-012"`, `1` | Clave estable; sube `version` cada vez que edites el reactivo |
| `rutas` | `["todas"]`, `["medicina"]` | Filtrar por carrera |
| `area` / `subarea` / `tema` | `PM` / `PM-MAT` / `PM-MAT-LM` | Reporte por niveles (enlaza con `taxonomia`) |
| `habilidad` | `identificar`, `interpretar`, `evaluar`, `recordar`, `comprender`, `aplicar`, `analizar` | Diagnóstico por tipo de habilidad |
| `dificultad_estimada` | `1`–`3` | Armar diagnósticos equilibrados. Se reemplaza por la dificultad real después del piloto |
| `formato` | `cuestionamiento_directo`, `seleccion_fragmento`, `completar`, `ordenar` | Cómo pintar la pregunta |
| `texto_id` | `"TX-03"` o `null` | Mostrar la lectura junto a la pregunta |
| `enunciado` | texto; `\n` = salto de línea | Usar `white-space: pre-line` |
| `opciones[]` | `{id, texto, correcta, argumentacion, error_id}` | Las argumentaciones no mencionan letras, así que **se pueden barajar** |
| `explicacion` | procedimiento paso a paso (`\n` separa pasos) | Pantalla de revisión |
| `referencias[]` | `{fuente, ubicacion}` | Botón «Estudiar este tema» |
| `tiempo_estimado_seg` | `90` | Calcular la duración del examen |
| `estado` | `borrador` → `revisado_ia` → `validado` → `publicado` | Mostrar solo `publicado` en producción |
| `revision` | rúbrica (1–4), `puntaje`, `cambios[]`, `observaciones` | Panel interno de control de calidad |

**Datos que no van en este archivo sino en tu base de datos:** las respuestas de los alumnos y las estadísticas de cada reactivo (veces presentado, porcentaje de acierto, discriminación y porcentaje de elección de cada distractor).

## Reglas de calificación

```js
// 1) Por tema y subárea
dominio = aciertos / presentados            // solo si presentados >= 3; si no, "datos insuficientes"
nivel   = dominio >= 0.80 ? "Dominas" : dominio >= 0.50 ? "En desarrollo" : "Área de oportunidad"

// 2) Calificación global ponderada por el peso oficial de cada subárea
global = Σ(dominio_subarea × reactivos_examen) / Σ(reactivos_examen)

// 3) Prioridad de estudio: lo que más vale y menos dominas va primero
prioridad = reactivos_examen × (1 − dominio)

// 4) Errores frecuentes: cuenta los error_id de las opciones incorrectas que eligió
//    Muestra los 3 más repetidos con su `recomendacion` del catálogo `errores`.
```

**Calibración después del piloto** (cuando un reactivo tenga unas 100 respuestas):
- `p` = proporción de aciertos. Fácil: más de 0.75; media: de 0.40 a 0.75; difícil: menos de 0.40.
- Discriminación: correlación entre acertar el reactivo y el puntaje total.
- Manda a revisión cualquier reactivo con `p` menor a 0.20, con discriminación menor a 0.15, o con un distractor que casi nadie elige (menos del 5 %).

## Cómo mostrarlo

1. **Durante el examen:** una pregunta por pantalla, con la lectura a la izquierda cuando `texto_id` no es nulo. Cronómetro (`tiempo_limite_min`), opción de marcar para revisar y opciones barajadas.
2. **Resultados:**
   1. Calificación global y nivel.
   2. «Tus 3 prioridades», ordenadas por `prioridad`, con su peso en el examen y un botón **Estudiar**.
   3. Mapa área → subárea → tema con colores de semáforo.
   4. Errores frecuentes.
   5. Revisión pregunta por pregunta, con la argumentación de las 3 opciones y la explicación.

## Pendientes para la siguiente versión

- **Temas sin cubrir todavía:**
  - Premedicina: aparato respiratorio, aparato reproductor, sistemas linfático y musculoesquelético, sistema nervioso central y parasitología.
  - Química: constante de equilibrio.
  - Biología: funciones del ADN y del ARN, ingeniería genética, mutaciones, ecosistemas de México y reproducción.
  - Comprensión lectora: noticia (participación social).
- **Pocos reactivos difíciles** (9 de 93). El examen real discrimina más en la parte alta, así que el siguiente lote debe tener más de nivel 3.
- **Faltan áreas de la BUAP:** Inglés (diagnóstico) y Habilidades blandas y toma de decisiones. No se incluyeron porque la estructura del EPIU solo se confirmó en fuentes de terceros.
- **Validación humana:** la revisión registrada es una revisión docente simulada. Antes de publicar, un profesor de cada área debe cambiar `estado` a `validado`. Los 8 reactivos con `observaciones` son los primeros que hay que revisar.
