import * as admin from "firebase-admin";
import * as path from "path";
import * as readline from "readline";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "webpage-36e40";
const DATABASE_ID = "hackitba";

// Try to load service account key
const serviceAccountPath = path.join(__dirname, "../../service-account-key.json");
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
  console.log("✅ Usando credenciales del service account\n");
} catch (err) {
  console.log("⚠️  Service account no encontrado, usando credenciales por defecto\n");
  admin.initializeApp({
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();
db.settings({
  databaseId: DATABASE_ID,
});

const EMAIL_TEMPLATES_COLLECTION = "emailTemplates";
const MAIL_COLLECTION = "mail";

const templates = [
  "welcome",
  "emailVerification",
  "registrationIncomplete",
  "teamNotification_joined",
  "eventReminder",
  "postEvent",
  "passwordReset",
  "teamNotification_removed",
  "teamNotification_updated",
];

async function getUserEmail(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("📧 ¿Cuál es tu email para recibir los templates? ", (email) => {
      rl.close();
      resolve(email.trim());
    });
  });
}

async function sendTemplatePreview(email: string) {
  try {
    console.log(`\n📤 Enviando templates a ${email}...\n`);

    for (const templateId of templates) {
      try {
        const templateDoc = await db
          .collection(EMAIL_TEMPLATES_COLLECTION)
          .doc(templateId)
          .get();

        if (!templateDoc.exists) {
          console.log(`⚠️  Template '${templateId}' not found`);
          continue;
        }

        const data = templateDoc.data();
        const subject = data?.subject || `Preview: ${templateId}`;
        const html = data?.html || "";

        // Enviar a través de Firebase Mail collection
        await db.collection(MAIL_COLLECTION).add({
          to: email,
          message: {
            subject: `[PREVIEW] ${subject}`,
            html,
          },
        });

        console.log(`✅ Template '${templateId}' enviado`);
      } catch (error) {
        console.error(`❌ Error enviando '${templateId}':`, error);
      }
    }

    console.log(
      `\n🎉 ¡Todos los templates han sido enviados a ${email}!\n` +
      "Deberías recibirlos en los próximos minutos una vez que Firebase procese los emails."
    );
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

async function main() {
  try {
    const email = await getUserEmail();

    if (!email || !email.includes("@")) {
      console.error("❌ Email inválido");
      process.exit(1);
    }

    await sendTemplatePreview(email);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
