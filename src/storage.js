const SHARED_SECRET = process.env.CARD_COMPOSITOR_SHARED_SECRET;
const LOOKUP_URL = process.env.GRATITUDE_APP_API_URL;

function assertPdf(buffer, label) {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
  if (buffer.length < 5 || buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
    throw new Error(`${label} is not a PDF`);
  }
  return buffer;
}

function uploadUrl() {
  if (!LOOKUP_URL) throw new Error("GRATITUDE_APP_API_URL is not set");
  return new URL("/api/internal/staff-print-card", LOOKUP_URL).toString();
}

async function putPdf(slug, lang, buffer) {
  if (!SHARED_SECRET) throw new Error("CARD_COMPOSITOR_SHARED_SECRET is not set");
  const res = await fetch(uploadUrl(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
      "X-Internal-Secret": SHARED_SECRET,
      "X-Qr-Slug": slug,
      "X-Lang": lang,
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`staff-print-card ${lang} failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Store PDFs through Lovable so the service role never leaves that app.
 */
async function persistCardPdfs({ qrSlug, pdfEnBuffer, pdfEsBuffer }) {
  if (!qrSlug) throw new Error("qrSlug required to store print cards");
  const en = assertPdf(pdfEnBuffer, "English card");
  const es = assertPdf(pdfEsBuffer, "Spanish card");
  await putPdf(qrSlug, "en", en);
  await putPdf(qrSlug, "es", es);
  return true;
}

module.exports = { persistCardPdfs };
