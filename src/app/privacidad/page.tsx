import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aviso de privacidad" };

/**
 * Borrador del aviso integral. Los datos entre corchetes los debe completar el
 * responsable antes de lanzar, y conviene que lo revise un abogado.
 */
export default function Privacidad() {
  return (
    <div className="wrap band pila angosto lectura">
      <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>Aviso de privacidad</h1>
      <p className="small">Versión 2026-11. Si cambia, te lo pediremos aceptar de nuevo al entrar.</p>
      <h2>Quién es responsable</h2>
      <p>[Nombre o razón social del responsable], con domicilio en [domicilio], es responsable del tratamiento de tus datos. Contacto: [correo de privacidad].</p>
      <h2>Qué datos usamos</h2>
      <ul>
        <li>Tu correo, para que entres sin contraseña y para avisos de tu cuenta.</li>
        <li>Tu nombre de pila o apodo (opcional) y un alias para la liga.</li>
        <li>La carrera a la que aspiras y tu nivel de estudios.</li>
        <li>Tus respuestas, tiempos y resultados en los exámenes de práctica.</li>
        <li>Datos de tus compras: producto, monto y estado del pago. Los datos de tu tarjeta los maneja Mercado Pago; nosotros nunca los vemos.</li>
      </ul>
      <p>No pedimos datos sensibles, tu nombre completo, tu teléfono ni tu escuela.</p>
      <h2>Para qué</h2>
      <p>
        Para darte el servicio: calificar tus exámenes, decirte qué estudiar, llevar tu racha y tu liga, y darte acceso a lo que compraste. Con
        datos sin nombre medimos qué tan difícil es cada pregunta para mejorar el banco. No vendemos tus datos ni los usamos para publicidad de
        terceros.
      </p>
      <h2>Con quién se comparten</h2>
      <p>
        Solo con los proveedores que hacen funcionar el sitio: alojamiento y base de datos (Vercel y Neon), envío de correos (Resend) y cobro
        (Mercado Pago). Cuando tú generas un enlace para compartir tu avance, lo ve quien tenga el enlace: tu alias o nombre de pila, tu
        calificación estimada y tus temas, nunca tus respuestas ni tu correo. Puedes revocarlo cuando quieras.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes conocer, corregir, cancelar u oponerte al uso de tus datos. Desde <a href="/cuenta">tu cuenta</a> puedes descargar todo lo que
        guardamos, cambiar tus datos y borrar tu cuenta. Para cualquier otra solicitud escribe a [correo de privacidad]; respondemos en un máximo
        de 20 días hábiles.
      </p>
      <h2>Cookies</h2>
      <p>Usamos cookies propias para mantener tu sesión, recordar tu tema de color y guardar un examen sin cuenta. No usamos cookies de publicidad.</p>
      <h2>Edad</h2>
      <p>Puedes usar el sitio si tienes la edad para presentar el examen. Las compras las hace una persona mayor de edad.</p>
    </div>
  );
}
