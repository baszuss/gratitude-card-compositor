// src/ghl.js
//
// PATCHes Card_PDF_URL_EN, Card_PDF_URL_ES, and Card_Status back onto the GHL Contact
// once both PDFs are rendered and hosted. Field IDs are opaque GHL custom-field IDs —
// set these in your .env (see .env.example), copied from GHL: Settings > Custom Fields.

const GHL_API_BASE = "https://services.leadconnectorhq.com";

async function patchContactCardFields(contactId, { cardPdfUrlEn, cardPdfUrlEs, cardStatus }) {
  const apiKey = process.env.GHL_API_KEY;
  const apiVersion = process.env.GHL_API_VERSION || "2021-07-28";

  if (!apiKey) throw new Error("GHL_API_KEY is not set");

  const fieldIdEn = process.env.GHL_FIELD_ID_CARD_PDF_URL_EN;
  const fieldIdEs = process.env.GHL_FIELD_ID_CARD_PDF_URL_ES;
  const fieldIdStatus = process.env.GHL_FIELD_ID_CARD_STATUS;

  if (!fieldIdEn || !fieldIdEs || !fieldIdStatus) {
    throw new Error(
      "GHL_FIELD_ID_CARD_PDF_URL_EN / _ES / GHL_FIELD_ID_CARD_STATUS must be set — " +
        "copy these custom field IDs from GHL Settings > Custom Fields.",
    );
  }

  const body = {
    customFields: [
      { id: fieldIdEn, field_value: cardPdfUrlEn },
      { id: fieldIdEs, field_value: cardPdfUrlEs },
      { id: fieldIdStatus, field_value: cardStatus },
    ],
  };

  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: apiVersion,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GHL PATCH failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

module.exports = { patchContactCardFields };
