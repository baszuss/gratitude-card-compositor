// src/ghlEmail.js
//
// Sends the "printable cards" email via GHL's Conversations API instead of a
// third-party provider (Postmark). GHL's send-message endpoint accepts
// attachments as URLs directly — since this service already hosts the rendered
// PDFs publicly (same URLs used for the Card_PDF_URL_EN/ES field patch), we just
// pass those straight through. No file upload, no separate email provider.

const GHL_API_BASE = "https://services.leadconnectorhq.com";

async function sendCardEmailViaGHL({ contactId, toEmail, employeeFullName, cardPdfUrlEn, cardPdfUrlEs }) {
  const apiKey = process.env.GHL_API_KEY;
  const apiVersion = process.env.GHL_API_VERSION || "2021-07-28";

  if (!apiKey) throw new Error("GHL_API_KEY is not set");

  const body = {
    type: "Email",
    contactId,
    emailTo: toEmail,
    subject: `${employeeFullName} — printable 5×7 cards (English + Spanish)`,
    message:
      "Two print-ready 5x7 PDFs are attached.\n\n" +
      'Print at actual size (100%, no "fit to page"). ' +
      "Choose English or Spanish (or print both stations). " +
      "Acrylic insert and printing are your responsibility.",
    attachments: [cardPdfUrlEn, cardPdfUrlEs],
  };

  const res = await fetch(`${GHL_API_BASE}/conversations/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: apiVersion,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GHL send-message failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

module.exports = { sendCardEmailViaGHL };
