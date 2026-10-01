// src/ghlEmail.js
//
// GHL Conversations email. Do not attach the 5×7 PDFs — two files exceed the
// 25 MB cap. Staff get durable download links. Admin Print EN/ES emails one language.

const GHL_API_BASE = "https://services.leadconnectorhq.com";

function mailCopy({ employeeFullName, cardPdfUrlEn, cardPdfUrlEs, emailLang }) {
  const lang = emailLang === "en" || emailLang === "es" ? emailLang : "both";
  if (lang === "es") {
    return {
      subject: `${employeeFullName} — tarjeta 5×7 para imprimir (español)`,
      message:
        "Tu tarjeta de Thank You para imprimir está lista.\n\n" +
        "Imprime a tamaño real (100%, sin ajustar a la página).\n\n" +
        "Descarga la tarjeta 5x7 en español desde el enlace de este correo.",
      html:
        "<p>Tu tarjeta de Thank You para imprimir está lista.</p>" +
        "<p>Imprime a <strong>tamaño real (100%)</strong> — no uses “ajustar a la página.”</p>" +
        "<p><a href=\"" +
        cardPdfUrlEs +
        "\">Tarjeta 5×7 en español</a></p>" +
        "<p>El código QR grande abre tu página de Thank You. El pequeño abre gratitude-movement.com.</p>",
    };
  }
  if (lang === "en") {
    return {
      subject: `${employeeFullName} — printable 5×7 card (English)`,
      message:
        "Your printable Thank You card is ready.\n\n" +
        "Print at actual size (100%, no fit to page).\n\n" +
        "Download the English 5x7 card from the link in this email.",
      html:
        "<p>Your printable Thank You card is ready.</p>" +
        "<p>Print at <strong>actual size (100%)</strong> — do not use “fit to page.”</p>" +
        "<p><a href=\"" +
        cardPdfUrlEn +
        "\">English 5×7 card</a></p>" +
        "<p>The large QR opens your personal Thank You page. The small QR opens gratitude-movement.com.</p>",
    };
  }
  return {
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
}

async function sendCardEmailViaGHL({
  contactId,
  toEmail,
  employeeFullName,
  cardPdfUrlEn,
  cardPdfUrlEs,
  emailLang,
}) {
  const apiKey = process.env.GHL_API_KEY;
  const apiVersion = process.env.GHL_API_VERSION || "2021-07-28";

  if (!apiKey) throw new Error("GHL_API_KEY is not set");

  const copy = mailCopy({ employeeFullName, cardPdfUrlEn, cardPdfUrlEs, emailLang });

  // Conversations rejects emailTo unless it is exactly the Contact's email.
  const body = {
    type: "Email",
    contactId,
    subject: copy.subject,
    message: copy.message,
    html: copy.html,
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
