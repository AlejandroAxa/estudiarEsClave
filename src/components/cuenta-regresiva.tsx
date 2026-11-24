import { diaMx, diasEntre, formatoFecha } from "@/lib/fechas";

/** Cuenta regresiva a la fecha oficial (RF-52). Dice «fecha por confirmar» sin convocatoria. */
export function CuentaRegresiva({ fecha, examen }: { fecha: string | null; examen: string }) {
  if (!fecha)
    return (
      <div>
        <span className="cifra" style={{ fontSize: 28 }}>
          Fecha por confirmar
        </span>
        <p className="small">La pondremos aquí en cuanto salga la convocatoria 2027 del {examen}.</p>
      </div>
    );
  const dias = diasEntre(diaMx(), fecha);
  return (
    <div>
      <span className="cifra" style={{ fontSize: 40 }}>
        {dias > 0 ? dias : 0}
      </span>{" "}
      <span>{dias === 1 ? "día" : "días"} para tu examen</span>
      <p className="small">Fecha oficial: {formatoFecha(fecha)}</p>
    </div>
  );
}
