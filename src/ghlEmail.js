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
      "Your printable Thank You cards are attached (English and Spanish).\n\n" +
      "Print at actual size (100%, no fit to page). Use English, Spanish, or both. " +
      "The large QR is your personal Thank You page. The small QR is gratitude-movement.com.\n\n" +
      "English: " +
      cardPdfUrlEn +
      "\nSpanish: " +
      cardPdfUrlEs,
    html:
      "<p>Your printable Thank You cards are attached (English and Spanish).</p>" +
      "<p>Print at <strong>actual size (100%)</strong> — do not use “fit to page.” " +
      "Choose English, Spanish, or both stations.</p>" +
      "<p>The <strong>large QR</strong> opens your personal Thank You page. " +
      "The <strong>small QR</strong> opens gratitude-movement.com.</p>" +
      "<p>English: <a href=\"" +
      cardPdfUrlEn +
      "\">download</a><br/>Spanish: <a href=\"" +
      cardPdfUrlEs +
      "\">download</a></p>",
    attachments: [cardPdfUrlEn, cardPdfUrlEs],
  };

  const send = (payload) =>
    fetch(`${GHL_API_BASE}/conversations/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: apiVersion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

  let res = await send(body);
  if (!res.ok) {
    const errText = await res.text();
    if (/25\s*MB|file size/i.test(errText)) {
      delete body.attachments;
      body.message =
        "Your printable Thank You cards are ready (English and Spanish). Download the links below.\n\n" +
        body.message;
      body.html =
        "<p>Your printable Thank You cards are ready (English and Spanish). Use the download links below.</p>" +
        body.html;
      res = await send(body);
      if (!res.ok) {
        const retryText = await res.text();
        throw new Error(`GHL send-message failed: ${res.status} ${retryText}`);
      }
    } else {
      throw new Error(`GHL send-message failed: ${res.status} ${errText}`);
    }
  }

  return res.json();
}

module.exports = { sendCardEmailViaGHL };
