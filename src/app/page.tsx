import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, FlaskConical, Pill, Stethoscope } from "lucide-react";
import { Logotipo } from "@/components/marca";
import { CuentaRegresiva } from "@/components/cuenta-regresiva";
import { Semaforo, BarraRango } from "@/components/semaforo";
import { ciclo } from "@/lib/consultas";
import { sesionActual } from "@/lib/sesion";
import { t } from "@/textos/es-MX";
import { AREAS_GENERALES, totalCarreras } from "@/lib/areas-generales";
import { IconoArea } from "@/components/area-exani";
import { DibujoMotivo } from "@/components/motivo-area";

export default async function Portada() {
  const ses = await sesionActual().catch(() => null);
  if (ses?.perfil) redirect("/inicio");
  const c = await ciclo().catch(() => null);
  const cuartos = [
    { icono: Stethoscope, titulo: "Consulta", texto: "Una pregunta por pantalla, con la lectura al lado. Como el examen, pero con alguien que te explica." },
    { icono: FlaskConical, titulo: "Laboratorio", texto: "Tu diagnóstico por área, subárea y tema, con tus 3 prioridades según lo que más pesa en el EXANI-II." },
    { icono: Pill, titulo: "Farmacia", texto: "Tu dosis diaria de 10 preguntas. Cada opción trae su porqué, también las incorrectas." },
    { icono: Activity, titulo: "Pulso", texto: "Tu racha de estudio como un electrocardiograma. Un latido por cada día que estudias." },
  ];
  return (
    <>
      <section className="noche band" style={{ position: "relative", overflow: "hidden" }}>
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <span className="pastilla oscura">Simulador EXANI-II · BUAP 2027</span>
          <div style={{ margin: "28px 0 20px" }}>
            <Logotipo />
          </div>
          <h1 className="sr-only">Estudiar es Clave: simulador del EXANI-II para la BUAP, por área de conocimiento</h1>
          <p className="disp" style={{ fontWeight: 700, fontStretch: "115%", fontSize: "clamp(22px,2.6vw,32px)", lineHeight: 1.15, maxWidth: "26ch" }}>
            Entra a consulta, sal con tu diagnóstico y una receta de estudio.
          </p>
          <p className="lead" style={{ maxWidth: "54ch" }}>
            Elige tu área, contesta 3 preguntas de cada sección en 20 minutos y sin crear cuenta. Te decimos en qué vas bien y dónde está tu mayor margen.
          </p>
          <div className="fila" style={{ marginTop: 24 }}>
            <Link href="/mini" className="btn">
              Hacer mi mini diagnóstico gratis
            </Link>
            <Link href="/entrar" className="btn sec">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
        <svg className="ecg-fondo" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden>
          <path d="M0 110 H260 L290 110 L310 40 L335 150 L355 85 L380 110 H640 L670 110 L690 30 L715 150 L735 80 L760 110 H1200" />
        </svg>
      </section>

      <section className="band">
        <div className="wrap pila">
          <h2>Áreas generales</h2>
          <p className="lead">Tu carrera está en una de estas cuatro áreas. Cada una tiene sus carreras, su examen y su propio diagnóstico.</p>
          <div className="rejilla ag-indice">
            {AREAS_GENERALES.map((a) => (
              <Link
                key={a.slug}
                href={`/carreras/${a.slug}`}
                className={`hoja tarjeta-area ag-tarjeta ag-${a.tema}`}
                style={{ "--acento": a.acento } as React.CSSProperties}
              >
                <span className="tarjeta-mini ag-tarjeta-mini">
                  <DibujoMotivo tema={a.tema} acento={a.acento} className="ilustracion mini" />
                </span>
                <span className="fila entre">
                  <IconoArea nombre={a.icono} />
                  <span className="xs">{totalCarreras(a)} carreras</span>
                </span>
                <h3 className="ag-tarjeta-titulo">{a.nombre}</h3>
                <p className="small" style={{ marginBottom: 0 }}>
                  {a.lema}
                </p>
              </Link>
            ))}
          </div>
          <p className="small">
            ¿Vas por Medicina? Tiene su propia evaluación: <Link href="/carreras/medicina">mira la ruta de Medicina</Link>.
          </p>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2>Cuatro cuartos, un mismo objetivo</h2>
          <p className="lead">Todo el contenido es de autoría propia y cada pregunta trae la argumentación de sus 3 opciones.</p>
          <div className="rejilla rejilla-4" style={{ marginTop: 24 }}>
            {cuartos.map((c) => (
              <div className="hoja" key={c.titulo}>
                <c.icono size={28} strokeWidth={1.75} color="var(--ciruela)" aria-hidden />
                <h3 style={{ marginTop: 10 }}>{c.titulo}</h3>
                <p className="small" style={{ marginBottom: 0 }}>
                  {c.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap rejilla-2" style={{ alignItems: "center" }}>
          <div>
            <h2>Un resultado que sí te dice qué hacer</h2>
            <p>
              No te damos solo un número. Ves qué subáreas dominas, cuáles están en desarrollo y cuáles son tu área de oportunidad, ordenadas por lo que más
              puntos te puede dar.
            </p>
            <p className="small">{t.aviso.estimacion}</p>
          </div>
          <div className="hoja sin-pad" aria-label="Ejemplo de reporte de laboratorio">
            <div className="membrete">
              <b>Laboratorio Estudiar es Clave</b>
              <span>Ejemplo de resultados</span>
            </div>
            <table className="lab">
              <thead>
                <tr>
                  <th>Estudio</th>
                  <th>Resultado</th>
                  <th>Rango deseable 80–100 %</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Anatomía y fisiología", 0.56, "En desarrollo"],
                  ["Fundamentos de química", 0.43, "Área de oportunidad"],
                  ["Comprensión de lo matemático", 0.89, "Dominas"],
                ].map(([n, v, nivel]) => (
                  <tr key={n as string}>
                    <td>
                      {n}
                      <br />
                      <Semaforo nivel={nivel as string} />
                    </td>
                    <td className="num">{Math.round((v as number) * 100)} %</td>
                    <td>
                      <BarraRango valor={v as number} etiqueta={n as string} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="band noche">
        <div className="wrap rejilla-2" style={{ alignItems: "center" }}>
          <div>
            <h2>Gratis para empezar. Un solo pago si quieres todo.</h2>
            <p className="lead">
              Con tu cuenta tienes 3 días del pase completo sin tarjeta. Después sigues gratis con 15 preguntas al día, o pagas una vez hasta el día del examen.
              Sin renovaciones automáticas.
            </p>
            <div className="fila">
              <Link href="/planes" className="btn">
                Ver planes
              </Link>
            </div>
          </div>
          <div className="hoja" style={{ color: "var(--tinta)" }}>
            <CuentaRegresiva fecha={c?.fechaExamen ?? null} examen="EXANI-II" />
          </div>
        </div>
      </section>
    </>
  );
}
