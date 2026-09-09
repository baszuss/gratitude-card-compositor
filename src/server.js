// src/server.js
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { renderHtmlForLang } = require("./template");
const { renderPdf } = require("./render");
const { patchContactCardFields } = require("./ghl");
const { sendCardEmail } = require("./email");
const { fetchEmployeeByEmail } = require("./appApi");

const app = express();
app.use(express.json());

const FILES_DIR = path.join(__dirname, "..", "files");
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });

// Serve rendered PDFs publicly (this is what Card_PDF_URL_EN/ES point to)
app.use("/files", express.static(FILES_DIR));

app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * Expected webhook body from the GHL workflow (per Dimitri's correction, 2026-09-09):
 *
 * GHL is the TRIGGER only — tag + QR_Image_URL + hotel email. It does NOT hold
 * employee identity (no Employee_Slug field exists in GHL). Identity is loaded
 * from Supabase at render time, joined by email.
 *
 * {
 *   "contact_id": "abc123",
 *   "employee_email": "maya@example.com",   // used to join against Supabase employees.email
 *   "client_slug": "MarriottScottsdale",    // from GHL's Hotel_Location_ID — still GHL-owned
 *   "qr_image_url": "https://.../maya-chen-qr.png",  // generated in Phase 2, already encodes
 *                                                      // the correct Supabase qr_slug
 *   "client_print_email": "ops@hotel.com"
 * }
 */
app.post("/webhook/card", async (req, res) => {
  // Optional shared-secret check
  const expectedSecret = process.env.WEBHOOK_SHARED_SECRET;
  if (expectedSecret) {
    const provided = req.header("X-Webhook-Secret");
    if (provided !== expectedSecret) {
      return res.status(401).json({ error: "invalid webhook secret" });
    }
  }

  const body = req.body || {};
  const required = ["contact_id", "employee_email", "client_slug", "qr_image_url", "client_print_email"];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return res.status(400).json({ error: `missing fields: ${missing.join(", ")}` });
  }

  // Respond immediately; do the actual render/email work async so GHL's webhook
  // doesn't time out waiting on Playwright + email delivery.
  res.status(202).json({ ok: true, message: "card generation started" });

  try {
    await processCardJob({ body });
  } catch (err) {
    console.error(`[card job failed] contact_id=${body.contact_id}:`, err);
    // Consider adding retry logic or an alerting webhook here.
  }
});

async function processCardJob({ body }) {
  // Load the real identity data from Supabase — GHL only supplied the trigger + email.
  const supabaseEmployee = await fetchEmployeeByEmail(body.employee_email);

  const employee = {
    full_name: supabaseEmployee.full_name,
    first_name: supabaseEmployee.first_name,
    title: supabaseEmployee.title,
    specialty: supabaseEmployee.specialty,
    qr_image_url: body.qr_image_url, // this came from GHL (Phase 2) — already encodes the right slug
  };

  const fileBaseName = `${body.client_slug}_${supabaseEmployee.qr_slug}`;
  const htmlEn = renderHtmlForLang("en", employee);
  const htmlEs = renderHtmlForLang("es", employee);

  const [pdfEnBuffer, pdfEsBuffer] = await Promise.all([
    renderPdf(htmlEn),
    renderPdf(htmlEs),
  ]);

  const fileNameEn = `QR_EN_${fileBaseName}.pdf`;
  const fileNameEs = `QR_ES_${fileBaseName}.pdf`;

  fs.writeFileSync(path.join(FILES_DIR, fileNameEn), pdfEnBuffer);
  fs.writeFileSync(path.join(FILES_DIR, fileNameEs), pdfEsBuffer);

  const baseUrl = process.env.PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("PUBLIC_BASE_URL is not set");

  const cardPdfUrlEn = `${baseUrl.replace(/\/$/, "")}/files/${fileNameEn}`;
  const cardPdfUrlEs = `${baseUrl.replace(/\/$/, "")}/files/${fileNameEs}`;

  await patchContactCardFields(body.contact_id, {
    cardPdfUrlEn,
    cardPdfUrlEs,
    cardStatus: "Files Ready",
  });

  await sendCardEmail({
    toEmail: body.client_print_email,
    employeeFullName: employee.full_name,
    pdfEnBuffer,
    pdfEsBuffer,
    fileBaseName,
  });

  await patchContactCardFields(body.contact_id, {
    cardPdfUrlEn,
    cardPdfUrlEs,
    cardStatus: "Emailed",
  });

  console.log(`[card job done] contact_id=${body.contact_id} -> ${fileBaseName}`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Compositor listening on :${PORT}`));
