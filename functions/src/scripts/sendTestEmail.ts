import admin from "firebase-admin";
import {sendWelcomeEmail} from "../services/emailService";

/**
 * Script para testear el envío de emails usando templates
 * Ejecutar: npx ts-node src/scripts/sendTestEmail.ts
 */

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "webpage-36e40";

async function sendTestEmail() {
  try {
    console.log("📧 Enviando email de prueba...\n");

    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      console.log(`🔧 Inicializando Firebase Admin con proyecto: ${PROJECT_ID}`);
      console.log(`📦 Usando base de datos: hackitba\n`);
      admin.initializeApp({
        projectId: PROJECT_ID,
      });
    }

    // Solicitar email de destino
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const email = await new Promise<string>((resolve) => {
      rl.question("📬 Ingresa el email de destino: ", (answer: string) => {
        resolve(answer.trim());
        rl.close();
      });
    });

    if (!email || !email.includes("@")) {
      console.error("❌ Email inválido");
      process.exit(1);
    }

    const name = await new Promise<string>((resolve) => {
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl2.question("👤 Ingresa el nombre del destinatario (opcional): ", (answer: string) => {
        resolve(answer.trim() || "Usuario de prueba");
        rl2.close();
      });
    });

    console.log(`\n✉️  Enviando email de bienvenida a: ${email}`);
    console.log(`👤 Nombre: ${name}\n`);

    // Enviar email usando el servicio
    const result = await sendWelcomeEmail(email, name);

    if (result.success) {
      console.log("✅ Email enviado exitosamente!");
      console.log("\n📋 Detalles:");
      console.log(`   - Template usado: welcome`);
      console.log(`   - Destinatario: ${email}`);
      console.log(`   - El email ha sido agregado a la cola de envío`);
      console.log(`   - Revisa la colección 'mail' en Firestore (base de datos: hackitba)`);
      console.log("\n💡 Nota: El envío real depende de la extensión Resend Email configurada");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error al enviar email de prueba:", error);
    if (error instanceof Error) {
      console.error("   Mensaje:", error.message);
    }
    console.log("\n💡 Asegúrate de:");
    console.log("   1. Haber ejecutado: npm run init-email-templates");
    console.log("   2. Tener los templates creados en Firestore (base de datos: hackitba)");
    console.log("   3. Configurar credenciales de Firebase correctamente");
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  sendTestEmail();
}

export {sendTestEmail};
