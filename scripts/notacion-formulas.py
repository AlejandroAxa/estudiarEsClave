"""Pasa 11 reactivos del banco semilla a la notación de fórmulas (KaTeX y mhchem).

Cada reactivo cambiado sube a la versión 2: el contenido es el mismo, solo
cambia cómo se escribe. Uso: python3 scripts/notacion-formulas.py bancos/banco-semilla-medicina.json
"""
import json
import sys

ruta = sys.argv[1]
banco = json.load(open(ruta, encoding="utf-8"))
R = {r["id"]: r for r in banco["reactivos"]}


def op(r, letra, texto=None, arg=None):
    o = next(x for x in r["opciones"] if x["id"] == letra)
    if texto is not None:
        o["texto"] = texto
    if arg is not None:
        o["argumentacion"] = arg


CAMBIOS = {}

# ── Pensamiento matemático ──
r = R["PM-005"]
r["enunciado"] = r"¿Cuál es el resultado de la siguiente operación?" "\n" r"$$\frac{2^3 \cdot 2^5}{2^4}$$"
op(r, "A", r"$2^4$", r"Correcta. Se suman los exponentes al multiplicar ($3 + 5 = 8$) y se restan al dividir ($8 - 4 = 4$).")
op(r, "B", r"$2^{11}$", r"Incorrecta. Multiplica los exponentes ($3 \times 5 = 15$) y después resta 4; al multiplicar potencias de igual base, los exponentes se suman.")
op(r, "C", r"$2^{12}$", r"Incorrecta. Suma todos los exponentes ($3 + 5 + 4$); al dividir, el exponente del divisor se resta.")
r["explicacion"] = r"1) Al multiplicar potencias de igual base se suman los exponentes: $a^m \cdot a^n = a^{m+n}$, así que $2^3 \cdot 2^5 = 2^8$." "\n" r"2) Al dividir se restan: $\dfrac{a^m}{a^n} = a^{m-n}$, así que $\dfrac{2^8}{2^4} = 2^4 = 16$."

r = R["PM-007"]
r["enunciado"] = r"¿Cuál es el conjunto solución de la desigualdad $5 - 3x \geq 11$?"
op(r, "A", r"$x \geq -2$")
op(r, "B", r"$x \leq 2$", r"Incorrecta. Error de signos: $6 \div (-3) = -2$, no $2$.")
op(r, "C", r"$x \leq -2$", r"Correcta. $-3x \geq 6$; al dividir entre $-3$ se invierte la desigualdad: $x \leq -2$.")
r["explicacion"] = r"1) Resta 5 en ambos lados: $-3x \geq 6$." "\n" r"2) Divide entre $-3$ e invierte el sentido: $x \leq -2$." "\n" r"3) Comprueba con $x = -3$: $5 + 9 = 14 \geq 11$ ✓."

r = R["PM-010"]
r["enunciado"] = r"La altura de un balón pateado hacia arriba está dada por" "\n" r"$$h(t) = -5t^2 + 20t$$" "\n" r"¿Cuál es la altura máxima que alcanza?"
r["datos"] = [{"tex": "h", "desc": "altura, en metros"}, {"tex": "t", "desc": "tiempo, en segundos"}]
r["figura"] = {"tipo": "parabola", "f": "-5t^2+20t", "dominio": [0, 4], "marcar": [2, 20], "ejes": {"x": "t (s)", "y": "h (m)"}}
op(r, "A", r"$2\ \text{m}$", r"Incorrecta. $2$ es el tiempo (en segundos) en el que se alcanza el máximo, no la altura.")
op(r, "B", r"$4\ \text{m}$", r"Incorrecta. $4$ es el tiempo en el que el balón vuelve al suelo ($h = 0$), no una altura.")
op(r, "C", r"$20\ \text{m}$", r"Correcta. El máximo ocurre en $t = -\frac{b}{2a} = 2\ \text{s}$ y $h(2) = -5(4) + 20(2) = 20\ \text{m}$.")
r["explicacion"] = r"1) Encuentra el tiempo del vértice: $t = -\dfrac{b}{2a} = -\dfrac{20}{2(-5)} = 2\ \text{s}$." "\n" r"2) Evalúa la altura en ese tiempo: $h(2) = -5(2)^2 + 20(2) = -20 + 40 = 20\ \text{m}$."

# ── Química ──
r = R["QUI-002"]
r["enunciado"] = r"Se disuelven 20 g de $\ce{NaOH}$ en agua hasta obtener 500 mL de disolución. ¿Cuál es su molaridad?"
r["datos"] = [
    {"tex": "m", "desc": r"20 g de $\ce{NaOH}$"},
    {"tex": r"M_r", "desc": "40 g/mol"},
    {"tex": "V", "desc": "500 mL"},
]
op(r, "A", r"$0.001\ \text{M}$")
op(r, "B", r"$0.5\ \text{M}$")
op(r, "C", r"$1\ \text{M}$", r"Correcta. $n = 20 \div 40 = 0.5\ \text{mol}$; $V = 0.5\ \text{L}$; $M = 0.5 \div 0.5 = 1\ \text{mol/L}$.")
r["explicacion"] = r"1) Moles de soluto: $n = \dfrac{m}{M_r} = \dfrac{20}{40} = 0.5\ \text{mol}$." "\n" r"2) Volumen en litros: $V = 500\ \text{mL} = 0.5\ \text{L}$." "\n" r"3) Molaridad: $M = \dfrac{n}{V} = \dfrac{0.5}{0.5} = 1\ \text{M}$."

r = R["QUI-004"]
r["enunciado"] = r"Balancea la combustión del propano:" "\n" r"$$\ce{C3H8 + O2 -> CO2 + H2O}$$" "\n" r"¿Qué coeficiente le corresponde al $\ce{O2}$?"
op(r, "A", arg=r"Incorrecta. 10 es el número de átomos de oxígeno; cada molécula de $\ce{O2}$ aporta dos, así que se necesitan 5.")
op(r, "B", arg=r"Correcta. $\ce{C3H8 + 5O2 -> 3CO2 + 4H2O}$: hay 10 átomos de O a la derecha ($6 + 4$) y 5 moléculas de $\ce{O2}$ aportan 10.")
op(r, "C", arg=r"Incorrecta. Suma los coeficientes de los productos ($3 + 4$) en lugar de contar los átomos de oxígeno.")
r["explicacion"] = r"1) Carbono: 3 átomos, así que $\ce{3CO2}$." "\n" r"2) Hidrógeno: 8 átomos, así que $\ce{4H2O}$." "\n" r"3) Oxígeno a la derecha: $3(2) + 4(1) = 10$ átomos, así que $\ce{5O2}$."

r = R["QUI-005"]
r["enunciado"] = r"Según la ecuación" "\n" r"$$\ce{2H2 + O2 -> 2H2O}$$" "\n" r"¿cuántos gramos de agua se forman a partir de 4 mol de $\ce{H2}$?"
r["datos"] = [{"tex": r"M_r(\ce{H2O})", "desc": "18 g/mol"}]
op(r, "A", r"$36\ \text{g}$")
op(r, "B", r"$144\ \text{g}$", r"Incorrecta. Duplica los moles de agua (8 mol); la relación molar $\ce{H2}:\ce{H2O}$ es $1 : 1$.")
op(r, "C", r"$72\ \text{g}$", r"Correcta. La relación $\ce{H2}:\ce{H2O}$ es $2 : 2$ ($1 : 1$); 4 mol de $\ce{H2}$ producen 4 mol de $\ce{H2O}$: $4 \times 18 = 72\ \text{g}$.")
r["explicacion"] = r"1) Relación molar: 2 mol de $\ce{H2}$ producen 2 mol de $\ce{H2O}$." "\n" r"2) $4\ \text{mol}\ \ce{H2} \times \dfrac{2}{2} = 4\ \text{mol}\ \ce{H2O}$." "\n" r"3) Masa: $4 \times 18 = 72\ \text{g}$."

r = R["QUI-006"]
r["enunciado"] = r"La reacción" "\n" r"$$\ce{Zn + 2HCl -> ZnCl2 + H2}$$" "\n" r"es de tipo:"
op(r, "A", arg=r"Correcta. El zinc desplaza al hidrógeno del ácido: $\ce{A + BC -> AC + B}$.")
op(r, "C", arg=r"Incorrecta. En la doble sustitución dos compuestos intercambian iones ($\ce{AB + CD -> AD + CB}$); aquí reacciona un elemento.")

r = R["QUI-007"]
r["enunciado"] = r"La combustión del metano tiene un $\Delta H = -890\ \text{kJ/mol}$. ¿Qué indica el signo negativo?"
op(r, "A", arg=r"Incorrecta. Eso corresponde a $\Delta H > 0$ (reacción endotérmica).")
op(r, "B", arg=r"Correcta. $\Delta H < 0$ significa que la entalpía de los productos es menor que la de los reactivos: se libera energía.")
op(r, "C", arg=r"Incorrecta. El signo de $\Delta H$ indica intercambio de calor, no espontaneidad (que depende de la energía libre).")
r["explicacion"] = r"$\Delta H$ negativo: exotérmica (libera calor), como las combustiones. $\Delta H$ positivo: endotérmica."

r = R["QUI-009"]
r["enunciado"] = r"¿Qué tipo de hidrocarburo es $\ce{CH2=CH-CH3}$ y cuál es su nombre IUPAC?"
r["smiles"] = "C=CC"
op(r, "B", arg=r"Incorrecta. El propano ($\ce{CH3-CH2-CH3}$) solo tiene enlaces sencillos.")
op(r, "C", arg=r"Incorrecta. Un alquino tiene un triple enlace ($\ce{CH#C-CH3}$).")

r = R["QUI-010"]
r["enunciado"] = r"¿Cuál es el nombre IUPAC de $\ce{CH3-CH(CH3)-CH2-CH3}$?"
r["smiles"] = "CC(C)CC"

r = R["QUI-011"]
r["enunciado"] = r"El ácido acético ($\ce{CH3-COOH}$), presente en el vinagre, pertenece a la familia de los:"
r["smiles"] = "CC(=O)O"
op(r, "A", arg=r"Incorrecta. Aunque el carboxilo contiene un $\ce{-OH}$, este está unido a un carbono con doble enlace a oxígeno; un alcohol tiene el $\ce{-OH}$ unido a un carbono saturado.")
op(r, "B", arg=r"Incorrecta. Las cetonas tienen un $\ce{C=O}$ entre dos carbonos; aquí el $\ce{C=O}$ forma parte del grupo carboxilo.")
op(r, "C", arg=r"Correcta. El grupo $\ce{-COOH}$ (carboxilo) caracteriza a los ácidos carboxílicos.")
r["explicacion"] = r"Grupos clave: $\ce{-OH}$ alcohol; $\ce{-CHO}$ aldehído; $\ce{R-CO-R}$ cetona; $\ce{-COOH}$ ácido carboxílico; $\ce{-COO-}$ éster; $\ce{-NH2}$ amina."

IDS = ["PM-005", "PM-007", "PM-010", "QUI-002", "QUI-004", "QUI-005", "QUI-006", "QUI-007", "QUI-009", "QUI-010", "QUI-011"]
for i in IDS:
    r = R[i]
    if r["version"] == 1:
        r["version"] = 2
        rev = r.get("revision") or {}
        rev["cambios"] = list(rev.get("cambios") or []) + ["v2: fórmulas en notación KaTeX y química con \\ce{}; mismo contenido."]
        r["revision"] = rev

banco["meta"]["version"] = "1.1.0"
banco["meta"]["fecha"] = "2026-11-24"
json.dump(banco, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(ruta, "a", encoding="utf-8").write("\n")
print("Convertidos:", ", ".join(IDS))
