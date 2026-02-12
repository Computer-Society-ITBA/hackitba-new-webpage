import {logger} from "firebase-functions";
import admin from "firebase-admin";

const MAIL_COLLECTION = "mail";
const APP_URL = process.env.APP_URL || "https://hackitba.com";

const getDb = () => admin.firestore();

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    logger.info(`Queuing welcome email to ${email}`);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject: "¡Bienvenido a HackItBA! 🚀",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>¡Hola ${name}!</h2>
            <p>Gracias por registrarte en HackItBA. Estamos emocionados de tenerte con nosotros.</p>
            <p>Ya puedes acceder a tu cuenta e historia en el evento.</p>
            <a href="${APP_URL}/es/dashboard" style="display: inline-block; padding: 10px 20px; background: #FF8C00; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              Ir a mi Dashboard
            </a>
            <p style="margin-top: 40px; color: #666; font-size: 12px;">
              HackItBA 2025 - Buenos Aires
            </p>
          </div>
        `,
      },
    });

    logger.info(`Welcome email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing welcome email to ${email}:`, error);
    throw error;
  }
};

export const sendEventConfirmationEmail = async (
  email: string,
  name: string,
  role: string
) => {
  try {
    logger.info(`Queuing event confirmation email to ${email}`);

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

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject: "¡Registro al evento confirmado! ✅",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>¡Tu registro ha sido confirmado!</h2>
            <p>Hola ${name},</p>
            <p>Tu registro como <strong>${roleText}</strong> en HackItBA ha sido confirmado.</p>
            <p>Ahora puedes:</p>
            <ul>
              ${role === "participant" ? "<li>Crear o unirte a un equipo</li>" : ""}
              <li>Acceder a tu perfil</li>
              <li>Ver detalles del evento</li>
              <li>Conectar con otros participantes</li>
            </ul>
            <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background: #00CED1; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              Ver mi perfil
            </a>
            <p style="margin-top: 40px; color: #666; font-size: 12px;">
              HackItBA 2025 - Buenos Aires
            </p>
          </div>
        `,
      },
    });

    logger.info(`Event confirmation email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing event confirmation email to ${email}:`, error);
    throw error;
  }
};

export const sendEmailVerificationEmail = async (
  email: string,
  verificationLink: string
) => {
  try {
    logger.info(`Queuing email verification email to ${email}`);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject: "Confirma tu email para HackItBA",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Confirma tu email</h2>
            <p>Para completar tu registro, necesitamos que confirmes tu dirección de email.</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background: #FF8C00; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              Confirmar Email
            </a>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              O copia este enlace en tu navegador:<br/>
              ${verificationLink}
            </p>
            <p style="margin-top: 40px; color: #666; font-size: 12px;">
              HackItBA 2025 - Buenos Aires
            </p>
          </div>
        `,
      },
    });

    logger.info(`Email verification email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing email verification to ${email}:`, error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string
) => {
  try {
    logger.info(`Queuing password reset email to ${email}`);

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject: "Restablecer tu contraseña de HackItBA",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Restablecer contraseña</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña. Si no la solicitaste, ignora este email.</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #FF8C00; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
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

    let subject = "";
    let message = "";

    switch (action) {
    case "joined":
      subject = `¡Nuevo miembro en ${teamName}!`;
      message = `<p>${name} se ha unido a tu equipo.</p>`;
      break;
    case "removed":
      subject = `Cambio en tu equipo ${teamName}`;
      message = `<p>${name} ha sido removido del equipo.</p>`;
      break;
    case "updated":
      subject = `Tu equipo ${teamName} ha sido actualizado`;
      message = `<p>Tu equipo ha sido actualizado:</p><p>${details || ""}</p>`;
      break;
    }

    await getDb().collection(MAIL_COLLECTION).add({
      to: email,
      message: {
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Notificación de equipo</h2>
            ${message}
            <a href="${APP_URL}/es/dashboard/participante" style="display: inline-block; padding: 10px 20px; background: #00CED1; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              Ver mi equipo
            </a>
            <p style="margin-top: 40px; color: #666; font-size: 12px;">
              HackItBA 2025 - Buenos Aires
            </p>
          </div>
        `,
      },
    });

    logger.info(`Team notification email queued successfully for ${email}`);
    return {success: true};
  } catch (error) {
    logger.error(`Error queuing team notification email to ${email}:`, error);
    throw error;
  }
};
