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
    const template = await getEmailTemplate("teamAssignment_accepted");
    if (!template) {
      throw new Error("Team assignment accepted email template not found");
    }

    const variables = {
      name,
      teamName,
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
    const template = await getEmailTemplate("teamAssignment_rejected");
    if (!template) {
      throw new Error("Team assignment rejected email template not found");
    }

    const variables = {
      name,
      reason: reason || "",
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

    logger.info(`Team assignment rejected email queued for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing team assignment rejected email to ${email}:`, error);
    throw error;
  }
};

/**
 * Genera el HTML del email de recordatorio de inscripción incompleta
 * @param {string} name - Nombre del destinatario
 * @return {string} HTML del email
 */
const generateIncompleteRegistrationHtml = (name: string): string => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HackITBA - ¿Completaste tu inscripción?</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff">
    <tr>
      <td align="center" style="padding:40px 0;border-bottom:1px solid #cccccc">
        <a href="https://hackitba.com.ar" style="text-decoration:none">
          <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width:300px;height:auto;border:0;outline:0" />
        </a>
      </td>
    </tr>
    <tr><td height="30" style="height:30px;line-height:30px;font-size:0"></td></tr>
    <tr>
      <td style="padding:0 40px;font-size:24px;font-weight:bold;color:#101214;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif;line-height:32px">
        ¿Completaste tu inscripción?
      </td>
    </tr>
    <tr><td height="20" style="height:20px;line-height:20px;font-size:0"></td></tr>
    <tr>
      <td style="padding:0 40px;font-size:16px;line-height:26px;color:#333333;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif">
        Hola <strong>${name}</strong>,
      </td>
    </tr>
    <tr><td height="14" style="height:14px;line-height:14px;font-size:0"></td></tr>
    <tr>
      <td style="padding:0 40px;font-size:16px;line-height:26px;color:#333333;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif">
        Vimos que empezaste a registrarte en <strong>HackITBA</strong> pero no completaste la inscripción. ¿Pasó algo?
      </td>
    </tr>
    <tr><td height="14" style="height:14px;line-height:14px;font-size:0"></td></tr>
    <tr>
      <td style="padding:0 40px;font-size:16px;line-height:26px;color:#333333;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif">
        Si tenés alguna duda o problema para completar el proceso, ¡nos encantaría ayudarte! Comunicate con nosotros a través de nuestras redes sociales o escribinos directamente a
        <a href="mailto:computersociety@itba.edu.ar" style="color:#f97316;text-decoration:none;font-weight:bold">computersociety@itba.edu.ar</a>.
      </td>
    </tr>
    <tr><td height="32" style="height:32px;line-height:32px;font-size:0"></td></tr>
    <tr>
      <td align="center" style="padding:0 40px">
        <a href="${APP_URL}/es/auth" style="background-color:#f97316;color:#ffffff;text-decoration:none;padding:14px 36px;font-weight:bold;font-size:16px;border-radius:4px;display:inline-block;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif">
          Completar inscripción →
        </a>
      </td>
    </tr>
    <tr><td height="32" style="height:32px;line-height:32px;font-size:0"></td></tr>
    <tr>
      <td style="padding:0 40px;font-size:14px;line-height:22px;color:#666666;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif">
        ¡Esperamos verte en el evento!
      </td>
    </tr>
    <tr><td height="40" style="height:40px;line-height:40px;font-size:0"></td></tr>
    <!-- Social icons -->
    <tr>
      <td style="padding:0 40px;border-top:1px solid #eeeeee;padding-top:24px">
        <table align="center" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 6px">
              <a href="https://www.instagram.com/computer.society.itba/" style="text-decoration:none">
                <img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png"
                  alt="Instagram" width="32" height="32"
                  style="width:32px;height:32px;border:0;display:block;border-radius:6px" />
              </a>
            </td>
            <td style="padding:0 6px">
              <a href="https://x.com/cs_itba" style="text-decoration:none">
                <img src="https://cdn-icons-png.flaticon.com/32/5968/5968830.png"
                  alt="X / Twitter" width="32" height="32"
                  style="width:32px;height:32px;border:0;display:block;border-radius:6px" />
              </a>
            </td>
            <td style="padding:0 6px">
              <a href="https://www.linkedin.com/company/itba-computer-society/" style="text-decoration:none">
                <img src="https://cdn-icons-png.flaticon.com/32/3536/3536505.png"
                  alt="LinkedIn" width="32" height="32"
                  style="width:32px;height:32px;border:0;display:block;border-radius:6px" />
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td height="16" style="height:16px;line-height:16px;font-size:0"></td></tr>
    <tr>
      <td style="padding:0 40px 24px;font-size:12px;color:#999999;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,Verdana,sans-serif">
        © HackITBA — Computer Society ITBA &nbsp;·&nbsp;
        <a href="mailto:computersociety@itba.edu.ar" style="color:#999999;text-decoration:none">computersociety@itba.edu.ar</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Envía un email de recordatorio de inscripción incompleta
 * @param {string} email - Email del destinatario
 * @param {string | null} name - Nombre del destinatario
 * @return {Promise<{success: boolean}>}
 */
export const sendIncompleteRegistrationEmail = async (
  email: string,
  name: string | null
): Promise<{success: boolean}> => {
  const displayName = name || "participante";
  const subject = "¿Completaste tu inscripción al HackITBA?";
  const html = generateIncompleteRegistrationHtml(displayName);
  logger.info(`Queuing incomplete registration reminder to ${email}`);
  return sendCustomEmail(email, subject, html);
};

/**
 * Envía un email personalizado (cola en Firestore)
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
export const sendCustomEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<{success: boolean}> => {
  try {
    logger.info(`Queuing custom email to ${to}`);
    await getDb().collection(MAIL_COLLECTION).add({
      to,
      message: {
        subject,
        html,
      },
    });
    return {success: true};
  } catch (error) {
    logger.error("Error queuing custom email:", error);
    throw error;
  }
};
