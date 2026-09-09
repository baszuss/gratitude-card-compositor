// src/ghl.js
//
// Updates Card_PDF_URL_EN, Card_PDF_URL_ES, and Card_Status back onto the GHL Contact
// once both PDFs are rendered and hosted. Field IDs are opaque GHL custom-field IDs —
// set these in your .env (see .env.example), copied from GHL: Settings > Custom Fields.
//
// Per GHL's official docs (marketplace.gohighlevel.com/docs/ghl/contacts/update-contact):
// method is PUT (not PATCH), Version header must be "v3", and the custom field
// value key is "fieldValue" (camelCase), not "field_value".

const GHL_API_BASE = "https://services.leadconnectorhq.com";

async function patchContactCardFields(contactId, { cardPdfUrlEn, cardPdfUrlEs, cardStatus }) {
  const apiKey = process.env.GHL_API_KEY;

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
      { id: fieldIdEn, fieldValue: cardPdfUrlEn },
      { id: fieldIdEs, fieldValue: cardPdfUrlEs },
      { id: fieldIdStatus, fieldValue: cardStatus },
    ],
  };

  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: "v3",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GHL update failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

module.exports = { patchContactCardFields };
