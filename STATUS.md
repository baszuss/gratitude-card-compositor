# Shared status (Dimitri + Sebastian)
**Do not use chat paste as the source of truth.** Update this file (or a GitHub Issue that links here) when a row finishes. Pull before you start a task.

**Repos:** this compositor · `sifu-max/gratitude-attitude` (Lovable)  
**Shared Drive:** https://drive.google.com/drive/folders/1SUEJzm6sxN1mBkTj47Ngta4Tf3x1xX2L?usp=drive_link

**Go-live guest flow (10 Sep):** `SPEC_Unified_Employee_Landing_2026-09-10.md`. Sebastian print/QR: `BRIEF_Sebastian_2026-09-10_unified_landing.md`.

**Jocelyn:** hotel onboard SOP only. **Sebastian** owns photo on GHL intake, custom HTML, Thank You, and 5×7 (placeholder if missing).

## Go-live — unified landing + photo (open)

| ID | Owner | Task | Status |
|---|---|---|---|
| GL-S1 | Sebastian | Native GHL **Employee Photo** File Upload on staff survey | **Open** |
| GL-S2 | Sebastian | Custom enrollment HTML: photo well + native file embed; placeholder if none | **Open** |
| GL-S3 | Sebastian | Thank You: `photo_url` or Gratitude logo placeholder | **Open** |
| GL-S4 | Sebastian | 5×7: `photo_url` or placeholder; QR stays `thank-you?e=` | **Open** |
| GL-A1 | Dimitri / Cursor | Lookups + `sync-ghl` `photo_url` | **Code in repo** — publish Lovable + migration |
| GL-D1 | Dimitri | Small live destination-charge tip from Thank You | **Open** |

## Print compositor

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

## Payment engine (Sebastian — P0)

| ID | Owner | Task | Status |
|---|---|---|---|
| P0-1 | Sebastian | Destination charge on create (`transfer_data.destination` + `application_fee_amount`) | **Done** — `b5077dc` on `gratitude-payment-engine` main |
| P0-2 | Sebastian | Webhook must not double-pay now that Stripe auto-transfers on create | **Done** — `c0404f8` on main |
| P0-live | Dimitri | One small **live** tip with Jasmin’s real IDs | **Open on Dimitri** — destination charges are on main; still required before calling live tips fixed |
| P0-legacy | — | MX$159 (`pi_3UDuYF…`) will not auto-move on Sep 16 | **Confirmed** (Sebas + original brief). Platform balance only; sweeper is the closer |
| P1-sweep | Sebastian | Availability-aware outstanding Transfer | **Done (sandbox)** — `5e02ae0` on main. Dry-run default; `--execute` to move money. **Not run in production** — waiting Dimitri go-ahead on/after Stripe availability (~16 Sep) |
| P0-env | Sebastian | `TEST_CONNECTED_ACCOUNT_ID` | **Fixed locally** — real test Connect account |

**Sandbox (Sebastian, isolated):** staging Postgres, Stripe test mode, test Connect account, mocked guest-app lookups. Production data not touched. Confirmed: PI created with `transfer_data` + fee, payment succeeded, funds on the test connected account, webhook skipped the redundant Transfer, ledger `payout_status` = completed. Full writeup: `STATUS.md` on compositor **and** engine `STATUS.md` on main.

**Dimitri policy (10 Sep):** No one-off Dashboard Transfers and no “pay her now.” Staff net that landed on the **platform** (the 9 Sep Jasmin PI) must wait until Stripe marks those funds **available**, then an **engine job** Transfers net tip to her Connect. New tips must use destination charges so this exception is rare.

**P1 sweeper (built, sandbox-validated, `5e02ae0`):** Finds `direct_stripe_connect` gratuities that are not completed and whose PI has **no** `transfer_data` (legacy only; Jasmin is first, not special-cased). Uses Stripe `balance_transaction.available_on` / `status` — never a guessed date. When available, Transfers **net tip only**. Idempotent per `gratuity_id` (retry bug fixed: metadata must not include a varying attempt field). Dry-run unless `--execute`. Sandbox: skipped unavailable (~1 week out), transferred after test-balance top-up, skipped already-completed on retry.

**Production:** do not `--execute` until Dimitri says so **and** Stripe shows that charge **available** (expected ~16 Sep for Jasmin). Prefer dry-run against live first, then `--execute`.

**Still required before calling live tips fixed:** Dashboard in **live** mode, small MXN tip for Jasmin (`employees.id` `d8d6e813-58fa-4b90-8b70-ff7d9dfab5e4`, Connect `acct_1UAaakLiuHRbrPxu`). Guest “Thank you” is not proof. Need new `pi_…` with destination = her `acct_`, application fee = platform fee, tip pending on **her** Connect not the platform.

Full brief: Shared Drive → `BRIEF_Sebastian_2026-09-10.md`  
https://drive.google.com/drive/folders/1SUEJzm6sxN1mBkTj47Ngta4Tf3x1xX2L?usp=drive_link

### Bugs found + fixed tonight (worth knowing about)

- Railway's default Node build was missing Chromium's system libraries (`libglib-2.0.so.0` etc.) — fixed by switching to a Dockerfile using Microsoft's official Playwright image.
- GHL contact-update endpoint: was using `PATCH` + `Version: 2021-07-28` + `field_value` — all three wrong. Correct is `PUT` + `Version: v3` + `fieldValue` (camelCase). Confirmed against GHL's official docs and now working.
- Postmark dropped entirely — GHL's `POST /conversations/messages` (`type: "Email"`) sends the PDFs directly, using the same public URLs already generated for the field update. One less service to manage.

### New open question (found during testing, not resolved)

GHL's `emailTo` on that endpoint must be a registered address **on the contact being messaged** — it rejected sending to `Client_Print_Email` (a hotel address) while tagged to the employee's own contact (`CONVERSATIONS_MSG_INVALID_EMAILTO`). Tonight's test sent to the employee's own email instead, just to prove the mechanism works. **Real fix:** probably needs to send via a hotel-level GHL contact (Master Hotel record?) rather than the employee's contact — needs a decision, not more testing.

## Hotel onboard (Jocelyn tomorrow)

Path already in product: `/onboard` → GHL → admin approve → `/join/<code>` → `POST /api/admin/sync-ghl`. Remaining: confirm GHL field keys, secrets, one dry-run (`?dry=1`).
