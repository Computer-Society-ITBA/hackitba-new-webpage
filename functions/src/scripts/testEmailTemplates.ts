import admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";

/**
 * Script para verificar que los templates de email estén correctamente configurados
 * Ejecutar: npx ts-node src/scripts/testEmailTemplates.ts
 */

const EMAIL_TEMPLATES_COLLECTION = "emailTemplates";
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "webpage-36e40";
const DATABASE_ID = "hackitba";

// IDs de templates esperados
const EXPECTED_TEMPLATES = [
  "welcome",
  "eventConfirmation",
  "emailVerification",
  "passwordReset",
  "teamNotification_joined",
  "teamNotification_removed",
  "teamNotification_updated",
];

/**
 * Verifica que un template tenga todos los campos requeridos
 */
function validateTemplate(templateId: string, data: any): string[] {
  const errors: string[] = [];

  if (!data.subject || typeof data.subject !== "string") {
    errors.push(`${templateId}: Falta el campo 'subject' o no es string`);
  }

  if (!data.html || typeof data.html !== "string") {
    errors.push(`${templateId}: Falta el campo 'html' o no es string`);
  }

  if (!data.description || typeof data.description !== "string") {
    errors.push(`${templateId}: Falta el campo 'description' o no es string`);
  }

  if (!data.variables || !Array.isArray(data.variables)) {
    errors.push(`${templateId}: Falta el campo 'variables' o no es array`);
  }

  // Verificar que las variables declaradas existan en el HTML
  if (data.variables && data.html) {
    const declaredVars = new Set(data.variables);
    const htmlVars = new Set(
      [...data.html.matchAll(/{{(\w+)}}/g)].map((match) => match[1])
    );
    const subjectVars = new Set(
      [...(data.subject.matchAll(/{{(\w+)}}/g) || [])].map((match) => match[1])
    );

    // Variables en HTML/subject que no están declaradas
    const undeclaredVars = [...htmlVars, ...subjectVars].filter(
      (v) => !declaredVars.has(v)
    );
    if (undeclaredVars.length > 0) {
      errors.push(
        `${templateId}: Variables usadas pero no declaradas: ${undeclaredVars.join(", ")}`
      );
    }

    // Variables declaradas que no se usan
    const unusedVars = [...declaredVars].filter(
      (v) => !htmlVars.has(v) && !subjectVars.has(v)
    );
    if (unusedVars.length > 0) {
      errors.push(
        `${templateId}: Variables declaradas pero no usadas: ${unusedVars.join(", ")}`
      );
    }
  }

  return errors;
}

/**
 * Genera un preview del template con valores de ejemplo
 */
function generatePreview(
  templateId: string,
  subject: string,
  html: string,
  variables: string[]
): {subject: string; html: string} {
  const sampleData: Record<string, string> = {
    name: "Juan Pérez",
    email: "juan@example.com",
    teamName: "Los Innovadores",
    roleText: "Participante",
    dashboardUrl: "https://hackitba.com/es/dashboard",
    appUrl: "https://hackitba.com",
    verificationLink: "https://hackitba.com/verify?token=abc123",
    resetLink: "https://hackitba.com/reset?token=xyz789",
    details: "Se actualizó el nombre del equipo",
    participantFeatures: "<li>Crear o unirte a un equipo</li>",
  };

  let previewSubject = subject;
  let previewHtml = html;

  variables.forEach((variable) => {
    const value = sampleData[variable] || `[${variable}]`;
    const regex = new RegExp(`{{${variable}}}`, "g");
    previewSubject = previewSubject.replace(regex, value);
    previewHtml = previewHtml.replace(regex, value);
  });

  return {subject: previewSubject, html: previewHtml};
}

async function testEmailTemplates() {
  try {
    console.log("🧪 Verificando templates de email...\n");

    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      console.log(`🔧 Inicializando Firebase Admin con proyecto: ${PROJECT_ID}`);
      console.log(`📦 Usando base de datos: ${DATABASE_ID}\n`);
      admin.initializeApp({
        projectId: PROJECT_ID,
      });
    }

    const db = getFirestore(DATABASE_ID);
    let allValid = true;
    const foundTemplates: string[] = [];
    const allErrors: string[] = [];

    // Verificar cada template esperado
    for (const templateId of EXPECTED_TEMPLATES) {
      const docRef = db.collection(EMAIL_TEMPLATES_COLLECTION).doc(templateId);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.log(`❌ Template '${templateId}' NO ENCONTRADO`);
        allValid = false;
        allErrors.push(`Template '${templateId}' no existe en Firestore`);
        continue;
      }

      foundTemplates.push(templateId);
      const data = doc.data();
      const errors = validateTemplate(templateId, data);

      if (errors.length > 0) {
        console.log(`⚠️  Template '${templateId}' tiene errores:`);
        errors.forEach((error) => console.log(`   - ${error}`));
        allValid = false;
        allErrors.push(...errors);
      } else {
        console.log(`✅ Template '${templateId}' - OK`);

        // Mostrar info del template
        console.log(`   Subject: ${data?.subject}`);
        console.log(`   Variables: ${data?.variables?.join(", ") || "ninguna"}`);
        console.log(`   Descripción: ${data?.description}`);
      }

      console.log("");
    }

    // Resumen
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DE VERIFICACIÓN");
    console.log("=".repeat(60));
    console.log(`Templates esperados: ${EXPECTED_TEMPLATES.length}`);
    console.log(`Templates encontrados: ${foundTemplates.length}`);
    console.log(`Templates válidos: ${foundTemplates.length - allErrors.length}`);

    if (allValid) {
      console.log("\n✅ ¡Todos los templates están correctamente configurados!");

      // Generar preview de un template de ejemplo
      console.log("\n" + "=".repeat(60));
      console.log("👀 PREVIEW DEL TEMPLATE 'welcome'");
      console.log("=".repeat(60));

      const welcomeDoc = await db
        .collection(EMAIL_TEMPLATES_COLLECTION)
        .doc("welcome")
        .get();
      const welcomeData = welcomeDoc.data();

      if (welcomeData) {
        const preview = generatePreview(
          "welcome",
          welcomeData.subject,
          welcomeData.html,
          welcomeData.variables
        );

        console.log(`\nAsunto: ${preview.subject}`);
        console.log("\nHTML Preview:");
        console.log(preview.html.trim());
      }

      process.exit(0);
    } else {
      console.log("\n❌ Se encontraron errores en los templates");
      console.log("\nErrores encontrados:");
      allErrors.forEach((error) => console.log(`  - ${error}`));
      console.log(
        "\n💡 Ejecuta el script de inicialización para crear/actualizar templates:"
      );
      console.log("   npx ts-node src/scripts/initEmailTemplates.ts");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error al verificar templates:", error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testEmailTemplates();
}

export {testEmailTemplates};
