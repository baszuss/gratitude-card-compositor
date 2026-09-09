# Gratitude Card Compositor

Renders the mock-aligned 5x7 EN/ES employee Thank You cards via Playwright, triggered by a GHL
webhook. Deploys as a standalone Railway Node service, per the locked SOP (2026-09-09).

## Deploy to Railway

1. Push this folder to its own GitHub repo (or a subfolder Railway can target).
2. Railway dashboard → **New Service** → deploy from that repo.
3. Once deployed, copy the assigned public domain (Settings tab, same place you found
   `gratitude-payment-engine-production.up.railway.app` earlier).
4. Set environment variables (Variables tab) — copy from `.env.example`:
   - `GHL_API_KEY`, `GHL_API_VERSION`
   - `GHL_FIELD_ID_CARD_PDF_URL_EN`, `GHL_FIELD_ID_CARD_PDF_URL_ES`, `GHL_FIELD_ID_CARD_STATUS`
     (copy these opaque IDs from GHL: Settings → Custom Fields)
   - `POSTMARK_SERVER_TOKEN`, `EMAIL_FROM` (confirm Postmark is actually your provider first —
     see the note in `src/email.js`)
   - `PUBLIC_BASE_URL` = the Railway domain from step 3
   - `WEBHOOK_SHARED_SECRET` = any random string you generate; use the same value in GHL's
     webhook action headers
5. Railway will run `npm install` then the `postinstall` script, which downloads the Playwright
   Chromium browser — this step takes a few minutes on first deploy, that's expected.
6. Confirm it's up: `GET https://{your-domain}/health` should return `{"ok": true}`.

## GHL workflow setup (the trigger side)

In GHL, on the workflow that fires when a Contact is tagged `AcrylicCard` and `QR_Image_URL`
is set, add a **Webhook** action:

- **URL:** `https://{your-railway-domain}/webhook/card`
- **Method:** POST
- **Headers:** `X-Webhook-Secret: {the same WEBHOOK_SHARED_SECRET value}`
- **Body (JSON), map these merge fields exactly:**

```json
{
  "contact_id": "{{contact.id}}",
  "employee_full_name": "{{contact.employee_full_name}}",
  "employee_first_name": "{{contact.employee_first_name}}",
  "employee_title": "{{contact.employee_title}}",
  "employee_specialty": "{{contact.employee_specialty}}",
  "employee_slug": "{{contact.employee_slug}}",
  "client_slug": "{{contact.hotel_location_id}}",
  "qr_image_url": "{{contact.qr_image_url}}",
  "client_print_email": "{{contact.client_print_email}}"
}
```

Adjust the merge tag names to match whatever your actual GHL custom field keys are — the names
above are guesses based on the SOP's field table, not confirmed against your GHL account.

## Testing locally before deploying

```bash
npm install
npx playwright install --with-deps chromium
PUBLIC_BASE_URL=http://localhost:3000 npm start
```

Then POST a test payload:

```bash
curl -X POST http://localhost:3000/webhook/card \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": "test123",
    "employee_full_name": "Maya Chen",
    "employee_first_name": "Maya",
    "employee_title": "Stylist",
    "employee_specialty": "Color & Cut",
    "employee_slug": "maya-chen",
    "client_slug": "TestHotel",
    "qr_image_url": "https://api.qrserver.com/v1/create-qr-code/?data=https://ty.gratitude-movement.com/thank-you?e=maya-chen",
    "client_print_email": "your-own-email@example.com"
  }'
```

This will fail on the GHL PATCH step and the email step without real credentials set — that's
expected for a first local test. Check that the two PDFs land correctly in the `files/` folder
first; wire up real GHL/Postmark credentials once the render itself looks right.

## What's NOT done here — still needs your input

- Real GHL custom field IDs (placeholders in `.env.example`)
- Confirming Postmark is actually the email provider (see `src/email.js`)
- The exact merge-tag names in your GHL account for the webhook body (guessed above)
- Whether `PUBLIC_BASE_URL` should be this Railway service's raw domain or a custom domain
