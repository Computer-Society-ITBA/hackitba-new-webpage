import {logger} from "firebase-functions";
import {getFirestore} from "firebase-admin/firestore";

const MAIL_COLLECTION = "mail";
const EMAIL_TEMPLATES_COLLECTION = "emailTemplates";
const APP_URL = process.env.APP_URL || "https://hackitba.com.ar";

const getDb = () => getFirestore("hackitba");
/**
 * Obtiene un template de email desde Firestore
 * @param {string} templateId - ID del template a obtener
 * @return {Promise<any>} Template con subject y html, o null si no existe
 */
const getEmailTemplate = async (
  templateId: string
): Promise<{subject: string; html: string} | null> => {
  try {
    const templateDoc = await getDb()
      .collection(EMAIL_TEMPLATES_COLLECTION)
      .doc(templateId)
      .get();

    if (!templateDoc.exists) {
      logger.warn(`Email template ${templateId} not found in database`);
      return null;
    }

    const data = templateDoc.data();
    return {
      subject: data?.subject || "",
      html: data?.html || "",
    };
  } catch (error) {
    logger.error(`Error fetching email template ${templateId}:`, error);
    return null;
  }
};

/**
 * Reemplaza variables en un template con valores reales
 * @param {string} template - String del template con placeholders {{variable}}
 * @param {Record<string, string>} variables - Objeto con los valores a reemplazar
 * @return {string} Template con variables reemplazadas
 */
const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  });
  return result;
};

/**
 * Envía un email de bienvenida
 * @param {string} email - Email del destinatario
 * @param {string} name - Nombre del destinatario
 * @return {Promise<{success: boolean}>} Resultado del envío
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<{success: boolean}> => {
  try {
    logger.info(`Queuing welcome email to ${email}`);

    const template = await getEmailTemplate("welcome");
    if (!template) {
      throw new Error("Welcome email template not found");
    }

    const variables = {
      name,
      dashboardUrl: `${APP_URL}/es/dashboard`,
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.html, variables);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject,
        html,
      },
    });

    logger.info(`Welcome email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing welcome email to ${email}:`, error);
    throw error;
  }
};

/**
 * Envía un email de confirmación de evento
 * @param {string} email - Email del destinatario
 * @param {string} name - Nombre del destinatario
 * @param {string} role - Rol del usuario (participant, judge, mentor, collaborator)
 * @return {Promise<void>}
 */
export const sendEventConfirmationEmail = async (
  email: string,
  name: string,
  role: string
): Promise<void> => {
  try {
    logger.info(`Queuing event confirmation email to ${email}`);

    const template = await getEmailTemplate("eventConfirmation");
    if (!template) {
      throw new Error("Event confirmation email template not found");
    }

    const roleText =
      role === "participant" ?
        "Participante" :
        role === "judge" ?
          "Juez" :
          role === "mentor" ?
            "Mentor" :
            "Colaborador";

    const dashboardUrl =
      role === "participant" ?
        `${APP_URL}/es/dashboard/participante` :
        `${APP_URL}/es/dashboard`;

    const participantFeatures =
      role === "participant" ? "<li>Crear o unirte a un equipo</li>" : "";

    const variables = {
      name,
      roleText,
      dashboardUrl,
      participantFeatures,
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.html, variables);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject,
        html,
      },
    });

    logger.info(`Event confirmation email queued successfully for ${email}`);
  } catch (error) {
    logger.error(`Error queuing event confirmation email to ${email}:`, error);
    throw error;
  }
};

/**
 * Envía un email de verificación de correo
 * @param {string} email - Email del destinatario
 * @param {string} verificationLink - Link de verificación
 * @return {Promise<{success: boolean}>}
 */
export const sendEmailVerificationEmail = async (
  email: string,
  verificationLink: string
): Promise<{success: boolean}> => {
  try {
    logger.info(`Queuing email verification email to ${email}`);

    const template = await getEmailTemplate("emailVerification");
    if (!template) {
      throw new Error("Email verification template not found");
    }

    const variables = {
      verificationLink,
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.html, variables);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject,
        html,
      },
    });

    logger.info(`Email verification email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing email verification to ${email}:`, error);
    throw error;
  }
};

/**
 * Envía un email para restablecer la contraseña
 * @param {string} email - Email del destinatario
 * @param {string} resetLink - Link para restablecer contraseña
 * @return {Promise<{success: boolean}>}
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string
): Promise<{success: boolean}> => {
  try {
    logger.info(`Queuing password reset email to ${email}`);

    const template = await getEmailTemplate("passwordReset");
    if (!template) {
      throw new Error("Password reset email template not found");
    }

    const variables = {
      resetLink,
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.html, variables);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject,
        html,
      },
    });

    logger.info(`Password reset email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing password reset email to ${email}:`, error);
    throw error;
  }
};

export const sendTeamNotificationEmail = async (
  email: string,
  name: string,
  action: "joined" | "removed" | "updated",
  teamName: string,
  details?: string
) => {
  try {
    logger.info(`Queuing team notification email to ${email}`);

    const template = await getEmailTemplate(`teamNotification_${action}`);
    if (!template) {
      throw new Error(`Team notification (${action}) email template not found`);
    }

    const variables = {
      name,
      teamName,
      details: details || "",
      dashboardUrl: `${APP_URL}/es/dashboard/participante`,
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.html, variables);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject,
        html,
      },
    });

    logger.info(`Team notification email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing team notification email to ${email}:`, error);
    throw error;
  }
};

/**
 * Envía un email cuando un participante es aceptado y asignado a un equipo
 * @param {string} email - Email del participante
 * @param {string} name - Nombre del participante
 * @param {string} teamName - Nombre del equipo asignado
 * @return {Promise<{success: boolean}>}
 */
export const sendTeamAssignmentAcceptedEmail = async (
  email: string,
  name: string,
  teamName: string
): Promise<{success: boolean}> => {
  try {
    logger.info(`Queuing team assignment accepted email to ${email}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF8C00;">¡Felicitaciones ${name}!</h2>
        <p>Tu solicitud ha sido <strong style="color: #00CED1;">aceptada</strong>.</p>
        <p>Has sido asignado al equipo: <strong>${teamName}</strong></p>
        <p>Ahora puedes acceder a tu dashboard para ver los detalles de tu equipo 
           y comenzar a trabajar en tu proyecto.</p>
        <a href="${APP_URL}/es/dashboard/participante" 
           style="display: inline-block; padding: 12px 24px; background: #FF8C00; 
           color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ver mi equipo
        </a>
        <p style="margin-top: 30px; color: #666;">¡Buena suerte en el hackathon!</p>
      </div>
    `;

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject: "¡Has sido aceptado! - Equipo asignado en HackITBA",
        html,
      },
    });

    logger.info(`Team assignment accepted email queued for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing team assignment accepted email to ${email}:`, error);
    throw error;
  }
};

/**
 * Envía un email cuando un participante es rechazado
 * @param {string} email - Email del participante
 * @param {string} name - Nombre del participante
 * @param {string} reason - Razón del rechazo (opcional)
 * @return {Promise<{success: boolean}>}
 */
export const sendTeamAssignmentRejectedEmail = async (
  email: string,
  name: string,
  reason?: string
): Promise<{success: boolean}> => {
  try {
    logger.info(`Queuing team assignment rejected email to ${email}`);

    const reasonText = reason ?
      `<p>Motivo: <em>${reason}</em></p>` :
      "";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF8C00;">Hola ${name}</h2>
        <p>Lamentamos informarte que tu solicitud para participar sin equipo no ha sido aceptada en esta ocasión.</p>
        ${reasonText}
        <p>Sin embargo, aún puedes:</p>
        <ul>
          <li>Crear tu propio equipo desde el dashboard</li>
          <li>Unirte a un equipo existente con un código de invitación</li>
        </ul>
        <a href="${APP_URL}/es/dashboard/participante" 
           style="display: inline-block; padding: 12px 24px; background: #00CED1; 
           color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ir al Dashboard
        </a>
        <p style="margin-top: 30px; color: #666;">Si tienes preguntas, no dudes en contactarnos.</p>
      </div>
    `;

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject: "Actualización sobre tu solicitud - HackITBA",
        html,
      },
    });

    logger.info(`Team assignment rejected email queued for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing team assignment rejected email to ${email}:`, error);
    throw error;
  }
};
