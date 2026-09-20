// src/server.js
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { renderHtmlForLang } = require("./template");
const { renderPdf } = require("./render");
const { patchContactCardFields, upsertContactByEmail } = require("./ghl");
const { sendCardEmailViaGHL } = require("./ghlEmail");
const { fetchEmployeeByEmail } = require("./appApi");

const app = express();
app.use(express.json());

const FILES_DIR = path.join(__dirname, "..", "files");
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });

app.use("/files", express.static(FILES_DIR));

app.get("/health", (req, res) => res.json({ ok: true }));

function webhookAuthorized(req) {
  const provided =
    req.header("X-Webhook-Secret") || req.header("X-Internal-Secret") || "";
  const webhookSecret = process.env.WEBHOOK_SHARED_SECRET;
  const appSecret = process.env.CARD_COMPOSITOR_SHARED_SECRET;
  if (webhookSecret && provided === webhookSecret) return true;
  if (appSecret && provided === appSecret) return true;
  if (!webhookSecret && !appSecret) return true;
  return false;
}

function qrImageForThankYou(thankYouUrl) {
  return (
    "https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=M&data=" +
    encodeURIComponent(thankYouUrl)
  );
}

app.post("/webhook/card", async (req, res) => {
  if (!webhookAuthorized(req)) {
    return res.status(401).json({ error: "invalid webhook secret" });
  }

  const body = req.body || {};
  const required = ["contact_id", "employee_email"];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return res.status(400).json({ error: `missing fields: ${missing.join(", ")}` });
  }

  res.status(202).json({ ok: true, message: "card generation started" });

  try {
    await processCardJob({ body });
  } catch (err) {
    console.error(`[card job failed] contact_id=${body.contact_id}:`, err);
  }
});

async function processCardJob({ body }) {
  let supabaseEmployee = await fetchEmployeeByEmail(body.employee_email);

  const thankYouUrl = `https://ty.gratitude-movement.com/thank-you?e=${supabaseEmployee.qr_slug}`;
  const qrImageUrl =
    typeof body.qr_image_url === "string" && /^https?:\/\//i.test(body.qr_image_url.trim())
      ? body.qr_image_url.trim()
      : qrImageForThankYou(thankYouUrl);

  const bodyPhoto =
    typeof body.photo_url === "string" && /^https?:\/\//i.test(body.photo_url.trim())
      ? body.photo_url.trim()
      : "";
  let photoUrl = bodyPhoto || supabaseEmployee.photo_url || "";
  if (!photoUrl) {
    await new Promise((r) => setTimeout(r, 120000));
    try {
      supabaseEmployee = await fetchEmployeeByEmail(body.employee_email);
    } catch (err) {
      console.error(`[card photo re-lookup failed] contact_id=${body.contact_id}:`, err.message);
    }
    photoUrl = bodyPhoto || supabaseEmployee.photo_url || "";
  }

  const employee = {
    full_name: supabaseEmployee.full_name,
    first_name: supabaseEmployee.first_name,
    title: supabaseEmployee.title,
    specialty: supabaseEmployee.specialty,
    qr_image_url: qrImageUrl,
    photo_url: photoUrl,
  };

  const clientSlug = String(body.client_slug || supabaseEmployee.qr_slug || "staff")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "staff";
  const fileBaseName = `${clientSlug}_${supabaseEmployee.qr_slug}`;
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

  // Until go-live: render + write URLs on the Contact, do not auto-email.
  // Set CARD_EMAIL_ENABLED=1 on Railway only when ops green-lights GHL send.
  //
  // When enabled: send via the HOTEL's own print-recipient email, not the
  // employee's. GHL's Conversations API requires emailTo to be a registered
  // address on the contact being messaged, so we upsert (find-or-create) a
  // Contact whose own email IS client_print_email, then send against that
  // contactId. (Sending to the employee's contact with a hotel email throws
  // CONVERSATIONS_MSG_INVALID_EMAILTO - fixed 2026-09-14.)
  const emailEnabled = process.env.CARD_EMAIL_ENABLED !== "0";
  let emailSent = false;

  if (emailEnabled) {
    try {
      await sendCardEmailViaGHL({
        contactId: body.contact_id,
        toEmail: body.employee_email,
        employeeFullName: employee.full_name,
        cardPdfUrlEn,
        cardPdfUrlEs,
      });
      emailSent = true;
    } catch (err) {
      console.error(`[staff email send failed] contact_id=${body.contact_id}:`, err.message);
    }
    const printTo = body.client_print_email;
    if (printTo && String(printTo).toLowerCase() !== String(body.employee_email).toLowerCase()) {
      try {
        const hotelContactId = await upsertContactByEmail(printTo);
        await sendCardEmailViaGHL({
          contactId: hotelContactId,
          toEmail: printTo,
          employeeFullName: employee.full_name,
          cardPdfUrlEn,
          cardPdfUrlEs,
        });
      } catch (err) {
        console.error(`[hotel email send failed] contact_id=${body.contact_id}:`, err.message);
      }
    }
  } else {
    console.log(
      `[card email held] contact_id=${body.contact_id} en=${cardPdfUrlEn} es=${cardPdfUrlEs}`,
    );
  }

  // Card_Status reflects real outcome: held for manual send, confirmed sent,
  // or attempted-and-failed - never silently "Emailed" unless actually sent.
  let cardStatus;
  if (!emailEnabled) {
    cardStatus = "Ready  hold for ops email";
  } else if (emailSent) {
    cardStatus = "Emailed";
  } else {
    cardStatus = "Send Failed";
  }

  try {
    await patchContactCardFields(body.contact_id, {
      cardPdfUrlEn,
      cardPdfUrlEs,
      cardStatus,
    });
  } catch (err) {
    console.error(`[GHL patch failed, non-fatal] contact_id=${body.contact_id}:`, err.message);
  }

  console.log(`[card job done] contact_id=${body.contact_id} -> ${fileBaseName}, emailEnabled=${emailEnabled}, emailSent=${emailSent}`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Compositor listening on :${PORT}`));
