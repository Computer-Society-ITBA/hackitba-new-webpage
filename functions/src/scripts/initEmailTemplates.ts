/* eslint-disable linebreak-style */
import admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import * as path from "path";

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
    subject: "¡Bienvenido a HackItBA!",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Bienvenido</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    img { -ms-interpolation-mode: bicubic; }
    #outlook a { padding: 0; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    p, a, td { mso-line-height-rule: exactly; }
    p, a, td, body, table { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; }
    a [x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          ¡Bienvenido a HackItBA!
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 20px; line-height: 22px; color: #101214; text-align: center;">
                    ¡Hola {{name}}!
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: center;">
                    Gracias por registrarte en HackItBA. Estamos emocionados de tenerte con nosotros.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: center;">
                    Ya puedes acceder a tu cuenta e historia en el evento.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{dashboardUrl}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Ir a mi Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email de bienvenida para nuevos usuarios registrados",
    variables: ["name", "dashboardUrl"],
  },
  emailVerification: {
    subject: "HackITBA - Verificá tu dirección de email",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Verificar Email</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    img { -ms-interpolation-mode: bicubic; }
    #outlook a { padding: 0; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    p, a, td { mso-line-height-rule: exactly; }
    p, a, td, body, table { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; }
    a [x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 75%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          Verificá tu dirección de email
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Te enviamos este correo para confirmar que esta dirección de email te pertenece y poder activar correctamente tu cuenta.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Para completar el proceso de registro, hacé click en el botón de abajo y verificá tu dirección de email.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{verificationLink}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Verificar mi email
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 19px; color: #626f86; text-align: center;">
                          <a href="https://x.com/cs_itba" style="text-decoration: none; margin: 0 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00CED1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                            </svg>
                          </a>
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="text-decoration: none; margin: 0 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00CED1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                              <rect width="4" height="12" x="2" y="9"></rect>
                              <circle cx="4" cy="4" r="2"></circle>
                            </svg>
                          </a>
                          <a href="https://www.instagram.com/computer.society.itba/" style="text-decoration: none; margin: 0 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00CED1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                            </svg>
                          </a>
                          <a href="https://github.com/Computer-Society-ITBA" style="text-decoration: none; margin: 0 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00CED1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                              <path d="M9 18c-4.51 2-5-2-7-2"></path>
                            </svg>
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email de verificación de dirección de correo",
    variables: ["verificationLink"],
  },
  registrationSuccess: {
    subject: "¡Bienvenido a HackItBA!",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Bienvenida</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    img { -ms-interpolation-mode: bicubic; }
    #outlook a { padding: 0; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    p, a, td { mso-line-height-rule: exactly; }
    p, a, td, body, table { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; }
    a [x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          ¡Bienvenido a HackItBA!
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 20px; line-height: 22px; color: #101214; text-align: center;">
                    ¡Hola {{name}}!
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Gracias por registrarte en HackItBA. Estamos emocionados de tenerte con nosotros.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Ya puedes acceder a tu cuenta e historia en el evento.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{dashboardUrl}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Ir a mi Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email de bienvenida para nuevos usuarios registrados",
    variables: ["name", "dashboardUrl"],
  },
  registrationIncomplete: {
    subject: "HackITBA - Tu inscripción está incompleta",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Inscripción Incompleta</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          Tu inscripción está incompleta
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 20px; line-height: 22px; color: #101214; text-align: center;">
                    ¡Falta muy poco para terminar!
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Notamos que iniciaste el proceso de inscripción para la HackITBA, pero todavía faltan algunos pasos para terminarla.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Para asegurar tu lugar y poder participar de los desafíos que tenemos preparados este año, es necesario que finalices el registro lo antes posible.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{dashboardUrl}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Completar mi inscripción
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email recordatorio de inscripción incompleta",
    variables: ["dashboardUrl"],
  },
  teamNotification_joined: {
    subject: "HackITBA - Cambio en tu equipo {{teamName}}",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Nuevo integrante</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          ¡Tu equipo tiene un nuevo integrante!
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 20px; line-height: 22px; color: #101214; text-align: center;">
                    Hola {{name}}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Te escribimos para avisarte que tu equipo <strong>{{teamName}}</strong> ha sido actualizado. {{details}}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{dashboardUrl}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Ver mi equipo
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Notificación cuando un nuevo miembro se une al equipo",
    variables: ["name", "teamName", "details", "dashboardUrl"],
  },
  eventReminder: {
    subject: "HackITBA - ¡Faltan pocas semanas para el evento!",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Recordatorio</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          ¡Faltan pocas semanas para la HackITBA!
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 20px; line-height: 22px; color: #101214; text-align: center;">
                    {{eventDate}}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Te escribimos para recordarte que el {{eventDate}} se realizará la HackITBA. Pueden ingresar a partir de las {{startTime}}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    📍 Dirección: {{address}}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Estamos muy entusiasmados por tenerte a vos y a tu equipo como parte de esta edición.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email recordatorio antes del evento",
    variables: ["eventDate", "startTime", "address"],
  },
  postEvent: {
    subject: "HackITBA - ¡Gracias por participar!",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - ¡Gracias por participar!</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          ¡Gracias por ser parte de HackITBA!
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 20px; line-height: 22px; color: #101214; text-align: center;">
                    Fue un placer tenerte con nosotros
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Queremos agradecerte por tu participación y compromiso durante esta edición. Tu dedicación y creatividad son las que hacen que este evento sea único año tras año.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Hacé clic en el botón de abajo para ver nuevamente los proyectos presentados y conocer los resultados finales de la competencia.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{projectsLink}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Ver proyectos y resultados
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email de agradecimiento post-evento",
    variables: ["projectsLink"],
  },
  passwordReset: {
    subject: "Restablecer tu contraseña de HackItBA",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Restablecer Contraseña</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    img { -ms-interpolation-mode: bicubic; }
    #outlook a { padding: 0; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    p, a, td { mso-line-height-rule: exactly; }
    p, a, td, body, table { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; }
    a [x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          Restablecer tu contraseña
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Recibimos una solicitud para restablecer tu contraseña. Si no la solicitaste, ignora este email.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    Este enlace expira en 1 hora.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{resetLink}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email para restablecer contraseña olvidada",
    variables: ["resetLink"],
  },
  teamNotification_removed: {
    subject: "Cambio en tu equipo {{teamName}}",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Notificación de Equipo</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    img { -ms-interpolation-mode: bicubic; }
    #outlook a { padding: 0; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    p, a, td { mso-line-height-rule: exactly; }
    p, a, td, body, table { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; }
    a [x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          Cambio en tu equipo
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    {{name}} ha sido removido del equipo {{teamName}}.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{dashboardUrl}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Ver mi equipo
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Notificación cuando un miembro es removido del equipo",
    variables: ["name", "teamName", "dashboardUrl"],
  },
  teamNotification_updated: {
    subject: "Tu equipo {{teamName}} ha sido actualizado",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Notificación de Equipo</title>
  <style type="text/css">
    table { border-collapse: collapse; }
    img, a img { border: 0; height: auto; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 auto !important; padding: 0; width: 100% !important; }
    img { -ms-interpolation-mode: bicubic; }
    #outlook a { padding: 0; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    p, a, td { mso-line-height-rule: exactly; }
    p, a, td, body, table { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; }
    a [x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 480px) {
      .mw100 { max-width: 100% !important; }
      .w100 { width: 100% !important; }
      .w96 { width: 96% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 auto; background-color: #ffffff">
    <tr>
      <td style="font-size: 0"></td>
      <td align="center" valign="top" style="width: 580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%" class="w96">
          <tr>
            <td align="center">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center" style="padding: 40px 0; border-bottom: 1px solid #cccccc">
                    <a href="https://hackitba.com.ar">
                      <img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width: 300px; height: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 85%" class="w100">
                      <tr>
                        <td style="padding-top: 20px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 24px; line-height: 35px; color: #101214; text-align: center;">
                          Tu equipo ha sido actualizado
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 40px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 22px; color: #101214; text-align: left;">
                    {{details}}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 40px">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 3px; background-color: #EF802F;">
                          <a href="{{dashboardUrl}}" target="_blank" style="display: inline-block; border: 2px solid #EF802F; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 3px; padding: 15px 40px;">
                            Ver mi equipo
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%">
                <tr>
                  <td style="padding-top: 40px; padding-bottom: 40px" align="center">
                    <table style="width: 100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-top: 1px solid #cccccc; padding-top: 15px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          <a href="https://www.facebook.com/hackitba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/facebook.png" alt="Facebook" title="Facebook" style="line-height: 0px; outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://www.linkedin.com/company/itba-computer-society/" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #fad399; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/LinkedIn-2025.png" alt="LinkedIn" title="LinkedIn" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                          &nbsp;
                          <a href="https://x.com/cs_itba" style="font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #a5adba; text-decoration: none;">
                            <img src="https://image.e.atlassian.com/lib/fe4011727164047d751070/m/1/X-Socials.png" alt="X" title="X" style="outline: 0; padding: 0; border: 0; width: 25px; height: auto;" width="25" border="0" align="middle" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; font-family: 'Helvetica neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #626f86; text-align: center;">
                          © 2026 Computer Society ITBA. All rights reserved.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px" align="center">
                          <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="116" style="width: 116px;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size: 0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Notificación cuando el equipo es actualizado",
    variables: ["teamName", "details", "dashboardUrl"],
  },
  teamAssignment_accepted: {
    subject: "¡Has sido aceptado! - Equipo asignado en HackITBA",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Has sido aceptado</title>
  <style type="text/css">table{border-collapse:collapse}img,a img{border:0;height:auto;outline:none;text-decoration:none}body{height:100% !important;margin:0 auto !important;padding:0;width:100% !important}img{-ms-interpolation-mode:bicubic}#outlook a{padding:0}table{mso-table-lspace:0pt;mso-table-rspace:0pt}.ReadMsgBody{width:100%}.ExternalClass{width:100%}p,a,td{mso-line-height-rule:exactly}p,a,td,body,table{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}a [x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:480px){.mw100{max-width:100% !important}.w100{width:100% !important}.w96{width:96% !important}}</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 auto;background-color:#ffffff">
    <tr>
      <td style="font-size:0"></td>
      <td align="center" valign="top" style="width:580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%" class="w96">
          <tr>
            <td align="center" style="padding:40px 0;border-bottom:1px solid #cccccc">
              <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width:300px;height:auto;" /></a>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px 0 40px;color:#101214;font-size:16px;line-height:22px;">
              <h2 style="margin:0 0 12px 0;font-size:22px;line-height:30px;color:#101214;font-weight:700;">¡Felicitaciones {{name}}!</h2>
              <p style="margin:0 0 12px 0">Tu solicitud ha sido <strong style="color:#101214;">aceptada</strong>.</p>
              <p style="margin:0 0 12px 0">Has sido asignado al equipo: <strong>{{teamName}}</strong></p>
              <p style="margin:0 0 20px 0">Ahora puedes acceder a tu dashboard para ver los detalles de tu equipo y comenzar a trabajar en tu proyecto.</p>
              <div style="text-align:center;margin-top:20px;margin-bottom:12px;">
                <a href="{{dashboardUrl}}" target="_blank" style="display:inline-block;padding:14px 38px;background-color:#EF802F;color:#ffffff;text-decoration:none;border-radius:4px;border:2px solid #EF802F;font-weight:600;">Ver mi equipo</a>
              </div>
              <p style="margin-top:24px;color:#666;font-size:13px;">¡Buena suerte en el hackathon!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 20px 40px 20px;border-top:1px solid #e6e6e6;text-align:center;color:#9aa1ad;font-size:13px;">
              © 2026 Computer Society ITBA. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size:0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email cuando un participante es aceptado y asignado a un equipo",
    variables: ["name", "teamName", "dashboardUrl"],
  },
  teamAssignment_rejected: {
    subject: "Actualización sobre tu solicitud - HackITBA",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HackITBA - Actualización sobre tu solicitud</title>
  <style type="text/css">table{border-collapse:collapse}img,a img{border:0;height:auto;outline:none;text-decoration:none}body{height:100% !important;margin:0 auto !important;padding:0;width:100% !important}img{-ms-interpolation-mode:bicubic}#outlook a{padding:0}table{mso-table-lspace:0pt;mso-table-rspace:0pt}.ReadMsgBody{width:100%}.ExternalClass{width:100%}p,a,td{mso-line-height-rule:exactly}p,a,td,body,table{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}a [x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:480px){.mw100{max-width:100% !important}.w100{width:100% !important}.w96{width:96% !important}}</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff">
  <table align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 auto;background-color:#ffffff">
    <tr>
      <td style="font-size:0"></td>
      <td align="center" valign="top" style="width:580px">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%" class="w96">
          <tr>
            <td align="center" style="padding:40px 0;border-bottom:1px solid #cccccc">
              <a href="https://hackitba.com.ar"><img src="https://hackitba.com.ar/images/hackitba-alt-logo.png" alt="HackITBA" width="300" style="width:300px;height:auto;" /></a>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px 0 40px;color:#101214;font-size:16px;line-height:22px;">
              <h2 style="margin:0 0 12px 0;font-size:22px;line-height:30px;color:#101214;font-weight:700;">Hola {{name}}</h2>
              <p style="margin:0 0 12px 0">Lamentamos informarte que tu solicitud para participar sin equipo no ha sido aceptada en esta ocasión.</p>
              <p style="margin:0 0 12px 0">{{reason}}</p>
              <p style="margin-top:16px;color:#101214;">Si necesitas asistencia, por favor contactanos en: <a href="mailto:computersociety@itba.edu.ar" style="color:#101214; text-decoration:none;">computersociety@itba.edu.ar</a></p>
              <p style="margin-top:24px;color:#666;font-size:13px;">Si tienes preguntas adicionales, no dudes en contactarnos.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 20px 40px 20px;border-top:1px solid #e6e6e6;text-align:center;color:#9aa1ad;font-size:13px;">
              © 2026 Computer Society ITBA. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </td>
      <td style="font-size:0"></td>
    </tr>
  </table>
</body>
</html>`,
    description: "Email cuando un participante es rechazado para asignación de equipo",
    variables: ["name", "reason", "dashboardUrl"],
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

      // Try to load service account key
      const serviceAccountPath = path.join(__dirname, "..", "..", "service-account-key.json");
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
