import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Use the provided address as default FROM. Can be overridden via RESEND_FROM env var.
const FROM_EMAIL = process.env.RESEND_FROM || "no_reply@hackitba.com.ar";

/**
 * Cloud Function that listens to new documents in `mail` collection
 * and forwards them to Resend API.
 */
export const sendMailFromQueue = onDocumentCreated("mail/{docId}", async (event: any) => {
  // event.data may not include full document data in the v2 event payload; read the document directly to be safe
  try {
    const resourceName: string | undefined = event?.data?.name || event?.data?.ref || event?.resource;
    if (!resourceName) {
      logger.warn("Could not determine document resource name from event", event);
      return null;
    }

    // resourceName may be the full resource path including /documents/, extract the path after '/documents/'
    const parts = resourceName.toString().split("/documents/");
    const docPath = parts.length > 1 ? parts[1] : resourceName.toString();
    const docRef = admin.firestore().doc(docPath);
    const snap = await docRef.get();
    const data = snap.data();

    if (!data) {
      logger.warn("Mail document has no data", docPath);
      return null;
    }

    const to = data.to;
    const message = data.message || {};
    const subject = message.subject || "(no subject)";
    const html = message.html || "";

    if (!to) {
      logger.error("Mail document missing 'to' field", docPath, data);
      await docRef.update({status: "error", error: "missing_to"});
      return null;
    }

    if (!RESEND_API_KEY) {
      logger.error("RESEND_API_KEY is not set. Cannot send email.");
      await docRef.update({status: "error", error: "missing_api_key"});
      return null;
    }

    try {
      // Ensure we provide at least one of 'text' or 'html' to the Resend API.
      const safeHtml = (html || "").toString();
      const stripHtmlTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
      const textBodyCandidate = stripHtmlTags(safeHtml);
      const textBody = textBodyCandidate.length > 0 ? textBodyCandidate : (message.text || subject || "(no content)");

      const payload: any = {
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
      };

      if (safeHtml && safeHtml.trim().length > 0) payload.html = safeHtml;
      if (textBody && textBody.toString().trim().length > 0) payload.text = textBody;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        logger.error("Resend API error sending email:", res.status, text);
        await docRef.update({status: "error", error: text});
        return null;
      }

      logger.info("Email sent via Resend for", to);
      await docRef.update({status: "sent", sentAt: admin.firestore.FieldValue.serverTimestamp()});
      return null;
    } catch (error) {
      logger.error("Error sending email via Resend:", error);
      await docRef.update({status: "error", error: String(error)});
      return null;
    }
  } catch (err) {
    logger.error("Unhandled error in sendMailFromQueue:", err);
    return null;
  }
});
