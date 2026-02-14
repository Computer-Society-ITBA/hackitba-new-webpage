/* eslint-disable linebreak-style */
import admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";

/**
 * Script para inicializar los templates de email en Firestore
 * Ejecutar: npx ts-node src/scripts/initEmailTemplates.ts
 *
 * Configuración:
 * - Usa el projectId: webpage-36e40 por defecto
 * - Usa la base de datos: hackitba
 * - Para usar otro proyecto: FIREBASE_PROJECT_ID=tu-proyecto
 *   npx ts-node src/scripts/initEmailTemplates.ts
 */

const EMAIL_TEMPLATES_COLLECTION = "emailTemplates";
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "webpage-36e40";
const DATABASE_ID = "hackitba";

/**
 * Email templates configuration.
 */
const templates = {
  welcome: {
    subject: "¡Bienvenido a HackItBA! 🚀",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Hola {{name}}!</h2>
        <p>Gracias por registrarte en HackItBA. Estamos emocionados de tenerte con nosotros.</p>
        <p>Ya puedes acceder a tu cuenta e historia en el evento.</p>
        <a href="{{dashboardUrl}}" 
          style="display: inline-block; padding: 10px 20px; background: #FF8C00; color: white; 
          text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ir a mi Dashboard
        </a>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          HackItBA 2025 - Buenos Aires
        </p>
      </div>
    `,
    description: "Email de bienvenida para nuevos usuarios registrados",
    variables: ["name", "dashboardUrl"],
  },
  eventConfirmation: {
    subject: "¡Registro al evento confirmado! ✅",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Tu registro ha sido confirmado!</h2>
        <p>Hola {{name}},</p>
        <p>Tu registro como <strong>{{roleText}}</strong> en HackItBA ha sido confirmado.</p>
        <p>Ahora puedes:</p>
        <ul>
          {{participantFeatures}}
          <li>Acceder a tu perfil</li>
          <li>Ver detalles del evento</li>
          <li>Conectar con otros participantes</li>
        </ul>
        <a href="{{dashboardUrl}}" 
          style="display: inline-block; padding: 10px 20px; background: #00CED1; color: white; 
          text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ver mi perfil
        </a>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          HackItBA 2025 - Buenos Aires
        </p>
      </div>
    `,
    description: "Email de confirmación de registro al evento",
    variables: ["name", "roleText", "dashboardUrl", "participantFeatures"],
  },
  emailVerification: {
    subject: "Confirma tu email para HackItBA",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Confirma tu email</h2>
        <p>Para completar tu registro, necesitamos que confirmes tu dirección de email.</p>
        <a href="{{verificationLink}}" 
          style="display: inline-block; padding: 10px 20px; background: #FF8C00; color: white; 
          text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Confirmar Email
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          O copia este enlace en tu navegador:<br/>
          {{verificationLink}}
        </p>
        <p style="margin-top: 20px; color: #FF8C00; font-size: 12px; font-weight: bold;">
          ⏱ Este enlace expira en 5 minutos
        </p>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          HackItBA 2025 - Buenos Aires
        </p>
      </div>
    `,
    description: "Email de verificación de dirección de correo",
    variables: ["verificationLink"],
  },
  passwordReset: {
    subject: "Restablecer tu contraseña de HackItBA",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña. Si no la solicitaste, 
           ignora este email.</p>
        <a href="{{resetLink}}" 
          style="display: inline-block; padding: 10px 20px; background: #FF8C00; color: white; 
          text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Restablecer Contraseña
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Este enlace expira en 1 hora.
        </p>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          HackItBA 2025 - Buenos Aires
        </p>
      </div>
    `,
    description: "Email para restablecer contraseña olvidada",
    variables: ["resetLink"],
  },
  teamNotification_joined: {
    subject: "¡Nuevo miembro en {{teamName}}!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Notificación de equipo</h2>
        <p>{{name}} se ha unido a tu equipo.</p>
        <a href="{{dashboardUrl}}" 
          style="display: inline-block; padding: 10px 20px; background: #00CED1; color: white; 
          text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ver mi equipo
        </a>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          HackItBA 2025 - Buenos Aires
        </p>
      </div>
    `,
    description: "Notificación cuando un nuevo miembro se une al equipo",
    variables: ["name", "teamName", "dashboardUrl"],
  },
  teamNotification_removed: {
    subject: "Cambio en tu equipo {{teamName}}",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Notificación de equipo</h2>
        <p>{{name}} ha sido removido del equipo.</p>
        <a href="{{dashboardUrl}}" 
          style="display: inline-block; padding: 10px 20px; background: #00CED1; color: white; 
          text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ver mi equipo
        </a>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          HackItBA 2025 - Buenos Aires
        </p>
      </div>
    `,
    description: "Notificación cuando un miembro es removido del equipo",
    variables: ["name", "teamName", "dashboardUrl"],
  },
  teamNotification_updated: {
    subject: "Tu equipo {{teamName}} ha sido actualizado",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Notificación de equipo</h2>
        <p>Tu equipo ha sido actualizado:</p>
        <p>{{details}}</p>
        <a href="{{dashboardUrl}}" 
          style="display: inline-block; padding: 10px 20px; background: #00CED1; color: white; 
          text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ver mi equipo
        </a>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          HackItBA 2025 - Buenos Aires
        </p>
      </div>
    `,
    description: "Notificación cuando el equipo es actualizado",
    variables: ["teamName", "details", "dashboardUrl"],
  },
};

/**
 * Initializes email templates in Firestore.
 * @return {Promise<void>}
 */
async function initializeTemplates(): Promise<void> {
  try {
    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      console.log(`🔧 Inicializando Firebase Admin con proyecto: ${PROJECT_ID}`);
      console.log(`📦 Usando base de datos: ${DATABASE_ID}\n`);
      admin.initializeApp({
        projectId: PROJECT_ID,
      });
    }

    const db = getFirestore(DATABASE_ID);
    const batch = db.batch();

    console.log("Iniciando creación de templates de email...\n");

    Object.entries(templates).forEach(([templateId, templateData]) => {
      const docRef = db.collection(EMAIL_TEMPLATES_COLLECTION).doc(templateId);
      batch.set(docRef, {
        ...templateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Template '${templateId}' preparado`);
    });

    await batch.commit();
    console.log("\n🎉 Todos los templates han sido creados exitosamente!");
    console.log(`\nTotal de templates creados: ${Object.keys(templates).length}`);
    console.log("\nTemplates creados:");
    Object.keys(templates).forEach((id) => {
      console.log(`  - ${id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al inicializar templates:", error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  initializeTemplates();
}

export {templates, initializeTemplates};
