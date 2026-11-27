import Link from "next/link";
import { planParaRuta, type EstadoPlan } from "@/lib/planes";
import { planDeRuta, planPorSku, SKU_MEDICINA } from "@/lib/planes-area";

/**
 * Si el alumno compró el plan de un área pero su cuenta está en otra, se lo
 * decimos donde estudia: sin esto ve "Sin límite" y luego candados que no se
 * explican.
 */
export function AvisoPlanArea({ plan, rutaId }: { plan: EstadoPlan; rutaId: string }) {
  if (plan.plan !== "pase" || planParaRuta(plan, rutaId) === "pase") return null;
  const comprado = plan.productos.map((s) => planPorSku(s)?.nombre ?? (s === SKU_MEDICINA ? "Paquete Medicina" : null)).find(Boolean);
  if (!comprado) return null;
  const suyo = planDeRuta(rutaId);
  const area = planPorSku(plan.productos.find((s) => planPorSku(s)) ?? "")?.area;
  return (
    <div className="aviso aviso-plan pila" role="status">
      <p>
        Tu <b>{comprado}</b> abre las preguntas de {area ? area.nombre : "Medicina"}, pero tu cuenta está en {suyo ? suyo.area.nombre : "otra área"}. Los
        simulacros de esta área y las materias que tu plan no abre se quedan con el límite gratis.
      </p>
      <p className="fila">
        <Link href={`/diagnostico?area=${area ? area.slug : "medicina"}`} className="btn sec chico">
          Cambiar mi cuenta a {area ? area.corto : "Medicina"}
        </Link>
        {suyo && (
          <Link href={`/planes#${suyo.sku}`} className="btn disc chico">
            Ver el {suyo.nombre}
          </Link>
        )}
      </p>
    </div>
  );
}
