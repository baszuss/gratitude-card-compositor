// src/ghlEmail.js
//
// GHL Conversations email. Do not attach the 5×7 PDFs — two files exceed the
// 25 MB cap. Staff get durable Supabase (or fallback) download links.

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
      "Your printable Thank You cards are ready.\n\n" +
      "Print at actual size (100%, no fit to page). Use English, Spanish, or both.\n\n" +
      "Download the English 5x7 card and the Spanish 5x7 card from the links in this email.",
    html:
      "<p>Your printable Thank You cards are ready.</p>" +
      "<p>Print at <strong>actual size (100%)</strong> — do not use “fit to page.” " +
      "Use English, Spanish, or both.</p>" +
      "<p><a href=\"" +
      cardPdfUrlEn +
      "\">English 5×7 card</a><br/><a href=\"" +
      cardPdfUrlEs +
      "\">Spanish 5×7 card</a></p>" +
      "<p>The large QR opens your personal Thank You page. The small QR opens gratitude-movement.com.</p>",
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
