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
   - `GRATITUDE_APP_API_URL` = production (published)  
     `https://gratitude-movement.com/api/internal/employee-lookup`  
     (not the public `GET /api/public/employee-lookup?e=` guest route)
   - `CARD_COMPOSITOR_SHARED_SECRET` = the exact secret you generated and saved into Lovable's
     `CARD_COMPOSITOR_SHARED_SECRET` field — must match exactly on both sides
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
  "employee_email": "{{contact.email}}",
  "client_slug": "{{contact.hotel_location_id}}",
  "qr_image_url": "{{contact.qr_image_url}}",
  "client_print_email": "{{contact.client_print_email}}"
}
```

GHL is the trigger only here — per Dimitri's correction, it does not hold employee identity
(no `Employee_Slug` field exists in GHL). The compositor looks up the real name/title/slug
from Supabase's `employees` table, joined by `employee_email`. Adjust merge tag names above to
match your actual GHL fields if they differ.

**Important:** `qr_image_url` must already encode the correct Supabase `qr_slug` in its
destination (e.g. `.../thank-you?e={qr_slug}`) — generated in Phase 2 using the live Supabase
slug, since GHL has no slug of its own.

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
    "employee_email": "uzcateguileonsebastian@gmail.com",
    "client_slug": "TestHotel",
    "qr_image_url": "https://api.qrserver.com/v1/create-qr-code/?data=https://ty.gratitude-movement.com/thank-you?e=test-hotel-7vhsiw",
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
