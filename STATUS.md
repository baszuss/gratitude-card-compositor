# Shared status (Dimitri + Sebastian)
**Do not use chat paste as the source of truth.** Update this file (or a GitHub Issue that links here) when a row finishes. Pull before you start a task.

**Repos:** this compositor · `sifu-max/gratitude-attitude` (Lovable)

**Jocelyn tomorrow:** hotel **onboarding**, not 5×7 print. Print stays later.

## Print compositor (later)

| ID | Owner | Task | Status |
|---|---|---|---|
| C1 | Dimitri / Cursor | `POST /api/internal/employee-lookup` in gratitude-attitude | Done — published, verified (401/404/200 all tested) |
| C2 | Dimitri / Cursor | gitignore `files/`, env contract | Done |
| C3 | Dimitri / Cursor | Durable PDF storage (not Railway ephemeral disk) | **Still open** — PDFs currently on Railway's local disk, will be lost on redeploy |
| S1 | Sebastian | QR destination = live `?e={employees.qr_slug}` | Done — iPhone scan confirmed against real GHL QR |
| S2 | Sebastian | GHL webhook `POST /webhook/card` (email join, not GHL slug) | Done — real GHL Contact, full run, no errors |
| S3 | Sebastian | GHL custom field IDs on Railway | Done — `Card_PDF_URL_EN/ES`, `Card_Status` all populate correctly on the real Contact |
| S4 | Sebastian | Railway deploy + env | Done — see bugs fixed below |
| S5 | Sebastian | Confirm email provider (Postmark vs other) | **Resolved differently than planned** — using GHL's own Conversations API instead of Postmark, no third-party provider needed. See open question below. |
| S6 | Sebastian | One employee scan + 5×7 QA | Partial — iPhone scan done, real PDF rendered and verified (EN + ES). **Android still not tested.** |

GHL is **trigger only**. Identity = Supabase via the internal lookup. Guest page = `GET /api/public/employee-lookup?e=`.

### Bugs found + fixed tonight (worth knowing about)

- Railway's default Node build was missing Chromium's system libraries (`libglib-2.0.so.0` etc.) — fixed by switching to a Dockerfile using Microsoft's official Playwright image.
- GHL contact-update endpoint: was using `PATCH` + `Version: 2021-07-28` + `field_value` — all three wrong. Correct is `PUT` + `Version: v3` + `fieldValue` (camelCase). Confirmed against GHL's official docs and now working.
- Postmark dropped entirely — GHL's `POST /conversations/messages` (`type: "Email"`) sends the PDFs directly, using the same public URLs already generated for the field update. One less service to manage.

### New open question (found during testing, not resolved)

GHL's `emailTo` on that endpoint must be a registered address **on the contact being messaged** — it rejected sending to `Client_Print_Email` (a hotel address) while tagged to the employee's own contact (`CONVERSATIONS_MSG_INVALID_EMAILTO`). Tonight's test sent to the employee's own email instead, just to prove the mechanism works. **Real fix:** probably needs to send via a hotel-level GHL contact (Master Hotel record?) rather than the employee's contact — needs a decision, not more testing.

## Hotel onboard (Jocelyn tomorrow)

Path already in product: `/onboard` → GHL → admin approve → `/join/<code>` → `POST /api/admin/sync-ghl`. Remaining: confirm GHL field keys, secrets, one dry-run (`?dry=1`).
