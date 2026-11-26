/** Gráfica tipo termómetro para compartir (RF-34). Sin respuestas ni datos de contacto. */
import { ImageResponse } from "next/og";
import type { DatosAvance } from "./compartir";

export function imagenAvance(d: DatosAvance) {
  const subs = d.subareas.slice(0, 8);
  const mejora = d.primerGlobal != null && d.ultimoGlobal != null ? Math.round(d.ultimoGlobal - d.primerGlobal) : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0B1D2E", color: "#fff", padding: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 900, color: "#D4F1FB", letterSpacing: 1 }}>estudiar es clave</div>
          <div style={{ display: "flex", fontSize: 22, color: "#8FDCF5" }}>Expediente de avance · {d.ruta}</div>
        </div>
        <div style={{ display: "flex", marginTop: 36, gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 380 }}>
            <div style={{ fontSize: 28, color: "#D4F1FB" }}>{d.nombre}</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: 12 }}>
              <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1 }}>{d.ultimoGlobal == null ? "—" : Math.round(d.ultimoGlobal)}</div>
              {mejora != null && d.diagnosticos > 1 && (
                <div style={{ fontSize: 32, color: mejora >= 0 ? "#5FD08F" : "#FF8A7E", marginBottom: 18 }}>
                  {mejora >= 0 ? "+" : ""}
                  {mejora} desde el primero
                </div>
              )}
            </div>
            <div style={{ fontSize: 22, color: "#8FDCF5", marginTop: 8 }}>Calificación estimada de 0 a 100</div>
            <div style={{ display: "flex", gap: 28, marginTop: 36, fontSize: 24 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <b style={{ fontSize: 44 }}>{d.temasEstudiados}</b>temas
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <b style={{ fontSize: 44 }}>{d.preguntasPracticadas}</b>preguntas
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <b style={{ fontSize: 44 }}>{d.racha}</b>días seguidos
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 10 }}>
            {subs.map((x) => (
              <div key={x.nombre} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#D4F1FB" }}>
                  <span>{x.nombre}</span>
                  <span>{x.ahora == null ? "—" : `${Math.round(x.ahora * 100)} %`}</span>
                </div>
                <div style={{ display: "flex", height: 14, background: "#003B5C", borderRadius: 999, marginTop: 4, position: "relative" }}>
                  {x.antes != null && <div style={{ position: "absolute", left: `${x.antes * 100}%`, top: -3, width: 3, height: 20, background: "#8FDCF5" }} />}
                  <div style={{ width: `${(x.ahora ?? 0) * 100}%`, background: "#D4F1FB", borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 18, color: "#8FDCF5" }}>
          Estimación propia; no es un puntaje del CENEVAL. La raya marca el primer diagnóstico.
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
