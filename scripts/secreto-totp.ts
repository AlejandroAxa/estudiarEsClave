/** Genera un secreto TOTP en base32 para ADMIN_TOTP_SECRET. Uso: npm run admin:totp */
import { randomBytes } from "node:crypto";

const alf = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const bytes = randomBytes(20);
let bits = "";
for (const b of bytes) bits += b.toString(2).padStart(8, "0");
let secreto = "";
for (let i = 0; i + 5 <= bits.length; i += 5) secreto += alf[parseInt(bits.slice(i, i + 5), 2)];
console.log(`ADMIN_TOTP_SECRET=${secreto}`);
console.log(`\nEn tu app autenticadora agrega una cuenta con esta clave (tipo «basada en tiempo»),`);
console.log(`o abre este enlace en el celular:\notpauth://totp/Estudiar%20es%20Clave:admin?secret=${secreto}&issuer=Estudiar%20es%20Clave`);
