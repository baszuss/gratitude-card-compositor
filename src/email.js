// src/email.js
//
// Sends the required client email per SOP 3.5:
//   Subject: "{Employee_Full_Name} — printable 5×7 cards (English + Spanish)"
//   Both PDFs attached.
//
// ASSUMED PROVIDER: Postmark, per project notes — this was never confirmed as the
// actual provider in use. Confirm before relying on this in production; if it's
// something else (Resend, SES, etc.), swap the fetch call below accordingly.

async function sendCardEmail({ toEmail, employeeFullName, pdfEnBuffer, pdfEsBuffer, fileBaseName }) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.EMAIL_FROM || "info@gratitude-movement.com";

  if (!token) throw new Error("POSTMARK_SERVER_TOKEN is not set");

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      From: from,
      To: toEmail,
      Subject: `${employeeFullName} — printable 5×7 cards (English + Spanish)`,
      TextBody:
        "Two print-ready 5x7 PDFs are attached.\n\n" +
        "Print at actual size (100%, no \"fit to page\"). " +
        "Choose English or Spanish (or print both stations). " +
        "Acrylic insert and printing are your responsibility.",
      Attachments: [
        {
          Name: `QR_EN_${fileBaseName}.pdf`,
          Content: pdfEnBuffer.toString("base64"),
          ContentType: "application/pdf",
        },
        {
          Name: `QR_ES_${fileBaseName}.pdf`,
          Content: pdfEsBuffer.toString("base64"),
          ContentType: "application/pdf",
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

module.exports = { sendCardEmail };
