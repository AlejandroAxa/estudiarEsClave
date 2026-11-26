import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verificarFirmaMercadoPago } from "./mercadopago";

const SECRETO = "clave-de-prueba";
const firmar = (manifiesto: string, ts = "1742505638683") => `ts=${ts},v1=${createHmac("sha256", SECRETO).update(manifiesto).digest("hex")}`;
const base = "https://estudiaresclave.com/api/pagos/webhook";

describe("firma de Mercado Pago", () => {
  it("acepta un aviso de pago firmado como en la documentación", () => {
    const r = verificarFirmaMercadoPago({
      url: `${base}?data.id=123456&type=payment`,
      cuerpo: JSON.stringify({ type: "payment", action: "payment.updated", data: { id: "123456" } }),
      firma: firmar("id:123456;request-id:bb56a2f1-6aae-46ac-982e-9dcd3581d08e;ts:1742505638683;"),
      requestId: "bb56a2f1-6aae-46ac-982e-9dcd3581d08e",
      secreto: SECRETO,
    });
    expect(r).toEqual({ ok: true, id: "123456" });
  });

  it("tolera comillas o espacios alrededor de la clave en .env", () => {
    const r = verificarFirmaMercadoPago({
      url: `${base}?data.id=9&type=payment`,
      cuerpo: "",
      firma: firmar("id:9;request-id:abc;ts:1742505638683;"),
      requestId: "abc",
      secreto: ` "${SECRETO}" `,
    });
    expect(r.ok).toBe(true);
  });

  it("quita del manifiesto lo que no viene en el aviso", () => {
    const r = verificarFirmaMercadoPago({ url: base, cuerpo: JSON.stringify({ type: "payment", data: { id: 77 } }), firma: firmar("ts:1742505638683;"), requestId: null, secreto: SECRETO });
    expect(r).toEqual({ ok: true, id: "77" });
  });

  it("rechaza una firma hecha con otra clave", () => {
    const r = verificarFirmaMercadoPago({ url: `${base}?data.id=1&type=payment`, cuerpo: "", firma: firmar("id:1;request-id:x;ts:1;", "1"), requestId: "x", secreto: "otra" });
    expect(r).toMatchObject({ ok: false, motivo: "firma_invalida" });
  });

  it("rechaza avisos sin firma o sin clave configurada", () => {
    expect(verificarFirmaMercadoPago({ url: `${base}?data.id=1&type=payment`, cuerpo: "", firma: null, requestId: null, secreto: SECRETO })).toMatchObject({ motivo: "sin_firma" });
    expect(verificarFirmaMercadoPago({ url: `${base}?data.id=1&type=payment`, cuerpo: "", firma: "ts=1,v1=aa", requestId: null, secreto: "" })).toMatchObject({ motivo: "sin_secreto" });
  });

  it("deja pasar sin efecto los avisos que no son de pagos", () => {
    expect(verificarFirmaMercadoPago({ url: `${base}?topic=merchant_order&id=5`, cuerpo: "", firma: null, requestId: null, secreto: SECRETO })).toMatchObject({ ok: false, motivo: "otro_tipo", tipo: "merchant_order" });
  });
});
