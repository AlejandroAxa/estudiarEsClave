/** Piezas visuales de las páginas de áreas del EXANI-II: icono y trazo de monitor por familia. */
import {
  Atom, BookOpen, Brain, Briefcase, Calculator, ChartLine, Dices, Dna, Feather, FlaskConical, HeartPulse, Hourglass,
  Landmark, Languages, Microscope, PenLine, PiggyBank, Scale, Sigma, SquareFunction, Stethoscope, UsersRound,
  type LucideIcon,
} from "lucide-react";

const ICONOS: Record<string, LucideIcon> = {
  Atom, BookOpen, Brain, Briefcase, Calculator, ChartLine, Dices, Dna, Feather, FlaskConical, HeartPulse, Hourglass,
  Landmark, Languages, Microscope, PenLine, PiggyBank, Scale, Sigma, SquareFunction, Stethoscope, UsersRound,
};

export function IconoArea({ nombre, size = 28, color = "var(--ciruela)" }: { nombre: string; size?: number; color?: string }) {
  const I = ICONOS[nombre] ?? BookOpen;
  return <I size={size} strokeWidth={1.75} color={color} aria-hidden />;
}

/** Cada familia de áreas tiene su propio trazo en el negatoscopio. */
const FAMILIA: Record<string, "letras" | "numeros" | "vida" | "materia" | "sociedad"> = {
  "comprension-lectora": "letras",
  "redaccion-indirecta": "letras",
  ingles: "letras",
  literatura: "letras",
  "pensamiento-matematico": "numeros",
  aritmetica: "numeros",
  "calculo-diferencial-e-integral": "numeros",
  "matematicas-financieras": "numeros",
  "probabilidad-y-estadistica": "numeros",
  biologia: "vida",
  "ciencias-de-la-salud": "vida",
  premedicina: "vida",
  fisica: "materia",
  quimica: "materia",
  "ciencias-experimentales": "materia",
};

function trazo(slug: string) {
  switch (FAMILIA[slug] ?? "sociedad") {
    case "letras": // renglones de un texto que se escribe
      return "M0 60 H520 M560 60 H760 M800 60 H1200 M0 95 H300 M340 95 H880 M920 95 H1080 M0 130 H180 M220 130 H640";
    case "numeros": // una parábola sobre sus ejes
      return "M0 140 H1200 M600 20 V160 M300 20 Q600 260 900 20";
    case "vida": // el latido de la marca
      return "M0 110 H260 L290 110 L310 40 L335 150 L355 85 L380 110 H640 L670 110 L690 30 L715 150 L735 80 L760 110 H1200";
    case "materia": // una onda que se amortigua
      return "M0 90 C50 10 100 10 150 90 S250 170 300 90 S400 30 450 90 S550 140 600 90 S700 55 750 90 S850 115 900 90 S1000 75 1050 90 S1150 100 1200 90";
    default: // una línea del tiempo con sus hitos
      return "M0 100 H1200 M120 85 V115 M330 75 V125 M520 85 V115 M760 70 V130 M980 85 V115";
  }
}

export function TrazoArea({ slug }: { slug: string }) {
  return (
    <svg className="ecg-fondo" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden>
      <path d={trazo(slug)} />
    </svg>
  );
}
