"""Arma diagnósticos cortos y deja el resto del banco para Práctica.

La práctica no ofrece reactivos que estén en una plantilla activa de la ruta
(salvo los que el alumno ya vio en una revisión). Si el diagnóstico trae el
banco completo, un alumno nuevo no tiene nada que practicar. Este script
reescribe cada plantilla de diagnóstico con una muestra de su banco:

- Por subárea toma la mitad de los reactivos que tiene en el examen real
  (`reactivos_examen`), sin pasar de la mitad de los que hay en el banco, y
  nunca menos de 3 (el mínimo para reportar un dominio).
- Reparte la muestra entre los temas de la subárea y busca la mezcla de
  dificultad 1/4 fáciles, 1/2 medias y 1/4 difíciles.
- En Comprensión lectora toma textos completos (todas las preguntas de una
  lectura), porque las preguntas de un texto se presentan juntas.
- El tiempo límite es la suma de `tiempo_estimado_seg` de la muestra.

La calificación global ya pondera cada subárea por su peso en el examen real,
así que el resultado conserva las proporciones del EXANI-II aunque la muestra
sea más corta. Es determinista: con el mismo banco elige lo mismo.

Uso: python3 scripts/armar-diagnosticos.py bancos/banco-semilla-*.json
"""
import json
import math
import sys
from collections import defaultdict

MEZCLA = {1: 0.25, 2: 0.5, 3: 0.25}


def cuantos(peso, disponibles):
    return max(3, min(round(peso / 2), disponibles // 2))


def elegir(items, n):
    """Round-robin por tema; en cada tema toma la dificultad que más falta."""
    por_tema = defaultdict(list)
    for r in items:
        por_tema[r["tema"]].append(r)
    temas = sorted(por_tema)
    elegidos, cuenta = [], {1: 0, 2: 0, 3: 0}
    while len(elegidos) < n:
        avanzo = False
        for t in temas:
            if len(elegidos) >= n or not por_tema[t]:
                continue
            falta = lambda d: MEZCLA[d] * n - cuenta[d]
            r = max(por_tema[t], key=lambda x: (falta(x["dificultad_estimada"]), -por_tema[t].index(x)))
            por_tema[t].remove(r)
            elegidos.append(r)
            cuenta[r["dificultad_estimada"]] += 1
            avanzo = True
        if not avanzo:
            break
    return elegidos


def elegir_textos(items, n):
    """Lecturas completas hasta llegar a n preguntas."""
    por_texto = defaultdict(list)
    for r in items:
        por_texto[r["texto_id"]].append(r)
    elegidos = []
    for tx in sorted(por_texto, key=lambda t: (t is None, t or "")):
        if len(elegidos) >= n:
            break
        elegidos += por_texto[tx]
    return elegidos


def armar(ruta):
    banco = json.load(open(ruta, encoding="utf-8"))
    pesos = {s["id"]: s["reactivos_examen"] for a in banco["taxonomia"] for s in a["subareas"]}
    orden_sub = [s["id"] for a in banco["taxonomia"] for s in a["subareas"]]
    por_id = {r["id"]: r for r in banco["reactivos"]}
    for p in banco["plantillas"]:
        if p.get("modo", "diagnostico") != "diagnostico":
            continue
        # Las áreas de la plantilla definen la ruta (p. ej. Cálculo + Física).
        areas = {por_id[i]["area"] for i in p["reactivos"]}
        candidatos = [r for r in banco["reactivos"] if r["area"] in areas]
        por_sub = defaultdict(list)
        for r in candidatos:
            por_sub[r["subarea"]].append(r)
        muestra = []
        for sub in orden_sub:
            items = por_sub.get(sub)
            if not items:
                continue
            n = cuantos(pesos[sub], len(items))
            con_texto = any(r["texto_id"] for r in items)
            muestra += elegir_textos(items, n) if con_texto else elegir(items, n)
        p["reactivos"] = [r["id"] for r in muestra]
        p["tiempo_limite_min"] = math.ceil(sum(r["tiempo_estimado_seg"] for r in muestra) / 60)
        print(f"{ruta} {p['id']}: {len(muestra)} de {len(candidatos)} reactivos, {p['tiempo_limite_min']} min")
    texto = json.dumps(banco, ensure_ascii=False, indent=2)
    original = open(ruta, encoding="utf-8").read()
    open(ruta, "w", encoding="utf-8").write(texto + ("\n" if original.endswith("\n") else ""))


for archivo in sys.argv[1:]:
    armar(archivo)
