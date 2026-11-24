/** Contrato de una pasarela de pago. El sitio nunca recibe datos de tarjeta (SAQ A). */
export interface DatosCheckout {
  ordenId: string;
  titulo: string;
  totalMxn: number;
  urlRetorno: string;
  urlWebhook: string;
  correoPagador?: string | null;
}

export type EstadoPagoExterno = "aprobado" | "pendiente" | "rechazado" | "reembolsado";

export interface PagoExterno {
  referenciaExterna: string;
  ordenId: string;
  estado: EstadoPagoExterno;
  metodo: "tarjeta" | "oxxo" | "transferencia" | "otro";
  montoMxn: number;
}

export interface Pasarela {
  nombre: string;
  crearCheckout(d: DatosCheckout): Promise<{ url: string; referencia: string }>;
  /** Verifica la firma del aviso y devuelve el id del pago que hay que consultar, o null si no es válido. */
  verificarWebhook(req: Request, cuerpo: string): Promise<string | null>;
  /** Consulta el pago en la pasarela (nunca se confía solo en el aviso). */
  consultarPago(id: string): Promise<PagoExterno | null>;
}
