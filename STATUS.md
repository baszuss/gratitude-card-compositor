# Shared status (Dimitri + Sebastian)

**Do not use chat paste as the source of truth.** Update this file (or a GitHub Issue that links here) when a row finishes. Pull before you start a task.

**Repos:** this compositor · `sifu-max/gratitude-attitude` (Lovable)

**Jocelyn tomorrow:** hotel **onboarding**, not 5×7 print. Print stays later.

## Print compositor (later)

| ID | Owner | Task | Status |
|---|---|---|---|
| C1 | Dimitri / Cursor | `POST /api/internal/employee-lookup` in gratitude-attitude | **Code in** — set `CARD_COMPOSITOR_SHARED_SECRET` in Lovable + publish |
| C2 | Dimitri / Cursor | gitignore `files/`, env contract | In this commit |
| C3 | Dimitri / Cursor | Durable PDF storage (not Railway ephemeral disk) | Open |
| S1 | Sebastian | QR destination = live `?e={employees.qr_slug}` | Open |
| S2 | Sebastian | GHL webhook `POST /webhook/card` (email join, not GHL slug) | Open |
| S3 | Sebastian | GHL custom field IDs on Railway | Open |
| S4 | Sebastian | Railway deploy + env | Open |
| S5 | Sebastian | Confirm email provider (Postmark vs other) | Open |
| S6 | Sebastian | One employee scan + 5×7 QA | Open |

GHL is **trigger only**. Identity = Supabase via the internal lookup. Guest page = `GET /api/public/employee-lookup?e=`.

## Hotel onboard (Jocelyn tomorrow)

Path already in product: `/onboard` → GHL → admin approve → `/join/<code>` → `POST /api/admin/sync-ghl`. Remaining: confirm GHL field keys, secrets, one dry-run (`?dry=1`).
