# Banco semilla — Ruta Medicina BUAP (v1.4.0)

## Bancos ampliados (25 de noviembre de 2026)

Los ocho bancos crecieron a 2,889 reactivos distintos. Ningún reactivo anterior cambió de id ni de contenido, salvo los cuatro de la tabla de abajo, que subieron de versión.

| Banco | Versión | Reactivos | Nuevos |
| --- | --- | --- | --- |
| Medicina | 1.4.0 | 938 | 600 |
| Ciencias Exactas | 1.2.0 | 714 | 600 |
| Psicología | 1.1.0 | 563 | 400 |
| EPIU (cada una de las 4 áreas) | 1.1.0 | 763 | 500 |
| Inglés | 1.1.0 | 200 | 100 |

- Las áreas comunes (Comprensión lectora, Redacción indirecta y Pensamiento matemático) pasan de 63 a 363 reactivos y de 6 a 21 textos. Son los mismos en los ocho bancos, con el mismo id y contenido. Inglés suma 10 textos.
- Los reactivos nuevos de Física llevan la etiqueta `exactas-fis`, los de Probabilidad `exactas-pye` y los del módulo general EPIU `epiu-general-sociales` o `epiu-general-experimentales`, igual que los anteriores.
- Los diagnósticos no cambian: misma muestra, mismas proporciones y mismo tiempo. Todo lo nuevo va a Práctica.
- Los montos se escriben `$10,000`. En los reactivos nuevos venían como `\$10 000` o dentro de una fórmula (`$\$500$`), y KaTeX no los componía.
- Subieron a versión 2 los reactivos ICE-047, FIS-005 y QUI-029, y los nuevos CEA-195, ICE-153, FIS-035, FIS-083, FIS-116, PYE-044, PYE-088 y PYE-100 quedaron corregidos antes de importarse. En todos, la respuesta correcta era la única que empezaba con «≈» o «Aproximadamente». Ahora el redondeo se menciona en la argumentación.

| Ruta | Diagnóstico | Para Práctica (más 200 de Inglés) |
| --- | --- | --- |
| Medicina | 78 reactivos | 860 |
| Exactas: Cálculo y Física | 49 reactivos | 550 |
| Exactas: Cálculo y Probabilidad | 45 reactivos | 547 |
| Psicología | 43 reactivos | 520 |
| EPIU (cada una de las 4 áreas) | 55 o 56 reactivos | 707 o 708 |

Archivo: `banco-semilla-medicina.json` (JSON en UTF-8, listo para `fetch()` en la web o para importarse a una base de datos).

- **338 reactivos originales**, cada uno con 3 opciones y la argumentación de cada opción.
- **6 textos base**: artículo de opinión, ensayo, cuento, poema, convocatoria y noticia.
- **117 tipos de error** catalogados.
- **1 plantilla de diagnóstico.**

Todo el contenido es de autoría propia: no reproduce reactivos del CENEVAL ni ejercicios de libros.

## Banco de Ciencias Exactas (v1.1.0)

Archivo: `banco-semilla-exactas.json`. Comparte con Medicina los 63 reactivos de Comprensión lectora, Redacción indirecta y Pensamiento matemático (mismo id y mismo contenido) y suma 51 propios: Cálculo diferencial e integral (14), Física (22) y Probabilidad y estadística (15). De los 51, 24 son difíciles.

Cada aspirante de Exactas presenta dos módulos, así que el banco define dos rutas:

| Ruta | Módulos | Diagnóstico |
| --- | --- | --- |
| `exactas-fis` | Cálculo + Física | `diagnostico-exactas-cal-fis-v1`, 49 de 99 reactivos, 54 min |
| `exactas-pye` | Cálculo + Probabilidad y estadística | `diagnostico-exactas-cal-pye-v1`, 45 de 92 reactivos, 52 min |

Los reactivos de Cálculo llevan la etiqueta de grupo `exactas` (las dos rutas los ven), los de Física `exactas-fis` y los de Probabilidad `exactas-pye`. `npm run db:sembrar` importa todos los `bancos/banco-semilla-*.json`, Medicina primero, y publica un solo release con los dos bancos.

## Banco de Psicología (v1.0.0)

Archivo: `banco-semilla-psicologia.json`. Comparte con Medicina los 63 reactivos de Comprensión lectora, Redacción indirecta y Pensamiento matemático y suma 100 del módulo de Psicología: Bases biopsicosociales de la conducta (58) y Aportaciones de la psicología (42). Ruta `psicologia`, con `diagnostico-psicologia-v1` de 43 reactivos y 44 minutos.

## Bancos EPIU de la BUAP (v1.0.0)

Archivos: `banco-semilla-epiu-*.json`, uno por área de conocimiento. Cada uno trae las 63 preguntas comunes de Medicina (mismo id y contenido), 100 del módulo general y 100 del módulo de área. El módulo general es el mismo en las dos áreas que lo usan, así que se importa una sola vez.

| Ruta | Módulo general | Módulo de área | Diagnóstico | Para Práctica |
| --- | --- | --- | --- | --- |
| `epiu-economico-administrativas` | Ciencias Sociales (`CSO`) | `CEA` | 55 reactivos, 53 min | 208 |
| `epiu-sociales-humanidades` | Ciencias Sociales (`CSO`) | `CSH` | 55 reactivos, 53 min | 208 |
| `epiu-naturales-salud` | Ciencias Experimentales (`CEX`) | `CNS` | 55 reactivos, 54 min | 208 |
| `epiu-ingenierias-exactas` | Ciencias Experimentales (`CEX`) | `ICE` | 56 reactivos, 55 min | 207 |

Los reactivos del módulo general llevan la etiqueta de grupo `epiu-general-sociales` o `epiu-general-experimentales`, y cada ruta pertenece a uno de esos grupos y a `todas`. Así cada aspirante ve solo su módulo general y su módulo de área. Corresponden a las páginas de `/areas`: Ciencias sociales, Ciencias experimentales y los cuatro módulos de área de la BUAP.

## Banco de Inglés (v1.0.0)

Archivo: `banco-semilla-ingles.json`. 100 reactivos de nivel B1: Comprensión lectora (50, con 10 textos en inglés) y Redacción indirecta (50). Las preguntas y opciones están en inglés; las argumentaciones y explicaciones, en español.

- Llevan la etiqueta `todas`, así que aparecen en la Práctica de todas las rutas del EXANI-II.
- El área `ING` tiene `cuenta_puntaje: false`: como en el examen real, no suma a la calificación global. En el archivo va como `tipo: "transversal"` porque la base solo admite «transversal» y «modulo».
- No trae plantilla de diagnóstico: los diagnósticos son por ruta y este banco sirve a todas, así que los 100 quedan para Práctica.
- `TXI-06` no tiene título (`"titulo": null`) porque ING-026 pide elegirlo. El sitio no muestra encabezado en ese caso.

## Diagnósticos cortos

La práctica solo usa reactivos que no están en las plantillas activas de la ruta, o que el alumno ya vio en su revisión (regla R9). Por eso el diagnóstico es una muestra y el resto del banco queda para Práctica desde el primer día. `scripts/armar-diagnosticos.py` arma la muestra:

- Por subárea, la mitad de los reactivos que tiene en el examen real, sin pasar de la mitad de los que hay en el banco y nunca menos de 3 (el mínimo para reportar un dominio).
- Reparte la muestra entre los temas y busca 1/4 fáciles, 1/2 medias y 1/4 difíciles. En Comprensión lectora toma lecturas completas.
- El tiempo es la suma de `tiempo_estimado_seg`. La calificación global pondera cada subárea por su peso real, así que el resultado conserva las proporciones del EXANI-II.

| Ruta | Diagnóstico | Para Práctica |
| --- | --- | --- |
| Medicina | 78 reactivos, 72 min (los 53 temas) | 260 |
| Exactas: Cálculo y Física | 49 reactivos, 54 min | 50 |
| Exactas: Cálculo y Probabilidad | 45 reactivos, 52 min | 47 |
| Psicología | 43 reactivos, 44 min | 120 |
| EPIU (cada una de las 4 áreas) | 55 o 56 reactivos, 53 a 55 min | 207 o 208 |

Mini diagnóstico, muestra de 20 minutos y simulacro salen de la misma muestra. Si agregas reactivos, vuelve a correr `python3 scripts/armar-diagnosticos.py bancos/banco-semilla-*.json`.

## Estado de validación

Desde el 24 de noviembre de 2026 todos los reactivos de Medicina, Exactas y Psicología tienen el visto bueno docente, y desde el 25 de noviembre también los de los cuatro bancos EPIU, el de Inglés y todos los de las versiones ampliadas (los 489 anteriores conservan la fecha del 24): `estado: "validado"`, `validado_por: "Equipo docente de Estudiar es Clave"`, `validado_en: "2026-11-24"` y `origen: "ia"` (los redactó la IA y los aprobó un docente). El importador los acepta en modo estricto, el que se usa en producción. «publicado» no se escribe en el archivo: lo pone el sitio al publicar un release.

Si una base ya tenía estos reactivos importados como «SIN VALIDAR», reimportar el archivo validado les pone el visto bueno sin crear versiones nuevas.

## Distribución (proporcional al examen real)

| Área | Subárea | En el banco | En el examen |
|---|---|---|---|
| Comprensión lectora | Estudio / Literario / Participación social | 6 / 6 / 6 | 12 / 12 / 6 |
| Redacción indirecta | Estudio / Participación social | 10 / 10 | 15 / 15 |
| Pensamiento matemático | Comprensión de lo matemático / Matematización | 14 / 11 | 18 / 12 |
| Biología | La célula / Biodiversidad | 12 / 10 | 12 / 12 |
| Química | Fundamentos / Orgánica | 65 / 47 | 14 / 10 |
| Premedicina | Salud pública / Anatomía / Biol. celular / Bioquímica | 29 / 58 / 28 / 26 | 10 / 18 / 10 / 10 |

La respuesta correcta está repartida entre A, B y C (113, 112 y 113). Dificultad estimada: 71 fáciles, 199 medias y 68 difíciles.

**Cambios de la v1.3.0:** 200 reactivos nuevos, 100 de Química y 100 de Premedicina, y 11 tipos de error. Los 138 de la v1.2.0 no cambian. El diagnóstico `diagnostico-medicina-v1` es una muestra de 78 reactivos (72 min); ver «Diagnósticos cortos».

**Cambios de la v1.2.0:** 45 reactivos nuevos (lote 1 de temas pendientes), el texto TX-06 (noticia) y 19 tipos de error. Los 93 reactivos de la v1.1.0 no cambian, así que reimportar sobre una base que ya tenía la v1.1.0 solo agrega los 45 nuevos. El diagnóstico `diagnostico-medicina-v1` pasa de 93 a 138 reactivos y de 97 a 128 minutos.

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

## Fórmulas, ficha de datos, figuras y estructuras (desde la versión 1.1.0)

**Notación.** Las fórmulas se escriben entre signos de pesos y el sitio las compone con KaTeX:

- `$…$` fórmula en línea; `$$…$$` fórmula en su propia línea. Toda fórmula con más de una operación va en su propia línea.
- Química con mhchem dentro de una fórmula: `$\ce{C3H8 + 5O2 -> 3CO2 + 4H2O}$`, `$\ce{CH3-COOH}$`.
- Unidades con `\text{}` y un espacio: `$20\ \text{m}$`, `$0.5\ \text{L}$`. Punto decimal.
- Signo menos real (`-` dentro de la fórmula), multiplicación con `\cdot` o `\times`, fracciones con `\frac` o `\dfrac`.
- Variables siempre en modo matemático, también en el texto: «donde `$t$` es el tiempo».
- Para un signo de pesos literal escribe `\$`. Los precios viejos como «$1,200» o «$45» se siguen leyendo como dinero.
- Los textos sin `$` se ven igual que antes. El importador rechaza el archivo si una fórmula no compila.

**Campos opcionales del reactivo:**

| Campo | Para qué | Ejemplo |
| --- | --- | --- |
| `datos` | Ficha con los datos y sus unidades, antes de la pregunta | `[{"tex": "M_r", "desc": "40 g/mol"}]` |
| `figura` | Gráfica en la revisión (nunca en el examen) | `{"tipo": "parabola", "f": "-5t^2+20t", "dominio": [0, 4], "marcar": [2, 20], "ejes": {"x": "t (s)", "y": "h (m)"}}` |
| `smiles` | Estructura química dibujada en la revisión | `"CC(C)CC"` |

La función de `figura` solo admite números, `t` o `x`, `+ - * / ^` y paréntesis. `desc` en `datos` admite fórmulas.

**Explicación en pasos.** Si cada línea de `explicacion` empieza con `1)`, `2)`… el sitio la muestra como pasos numerados.

## Pendientes para la siguiente versión

- **Temas:** todos los temas del temario tienen reactivos. La v1.3.0 cubre ya la constante de equilibrio en Química.
- **Medidas epidemiológicas:** PRE-039 a PRE-041 (letalidad, prevalencia e incidencia) se clasificaron en «Historia natural de la enfermedad» porque el temario no tiene un tema propio para ellas.
- **Falta un área de la BUAP:** Habilidades blandas y toma de decisiones. Inglés ya tiene banco.
- **Preguntas parecidas entre rutas:** BIO-006 y CNS-012, PRE-010 y CNS-028, PRE-014 y CNS-026, y QUI-014 e ICE-094 preguntan lo mismo con otras palabras. No se repiten para nadie porque son de rutas distintas.
- **Validación humana:** hecha (ver «Estado de validación»). Si un docente pide cambiar un reactivo, sube su `version`.
