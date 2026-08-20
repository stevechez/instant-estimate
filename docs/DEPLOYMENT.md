# Deployment checklist

Everything here is configuration outside the codebase. The app can be
perfectly correct and still fail for a real user if these are wrong — and
most of these fail *silently*, which is why they're written down.

Work top to bottom; later steps depend on earlier ones.

---

## 1. Hosted Supabase project

1. Create the project.
2. Link and push migrations:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
3. Confirm all migrations applied — `supabase migration list` should show no
   gap between local and remote.

## 2. Supabase Auth URL configuration — the highest-risk step

**Authentication → URL Configuration** in the Supabase dashboard:

- **Site URL** → your real domain (e.g. `https://app.example.com`)
- **Redirect URLs** → add that domain

Why this matters more than anything else on this list: Supabase builds every
confirmation and password-reset link from **Site URL**. Left at its default,
a new contractor clicks "Confirm my email" and their browser tries to open a
server on *their own laptop*. They cannot finish signing up. The email sent
fine, the account exists, the link is just unreachable — and nothing appears
in your logs, because nothing failed on your side. You'd hear "I signed up
and nothing happened."

## 3. Auth email templates

The custom templates in `supabase/templates/` are applied automatically for
local development only. **Paste them into the hosted dashboard** under
Authentication → Email Templates:

- `confirmation.html` → "Confirm signup"
- `recovery.html` → "Reset password"

Without these, the hosted project uses Supabase's defaults, which bypass the
app's `/auth/confirm` route entirely. The account still gets confirmed, but
the user lands on the homepage appearing logged out and has to find the
login page on their own — on the very first thing they ever do. (See the
audit note in `src/app/auth/confirm/route.ts`.)

## 4. Transactional email

`SMTP_HOST` currently points at the local Mailpit relay, which exists only on
a dev machine. Point it at a real provider (Resend, Postmark, SES):

```
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASS= SMTP_FROM=
```

Lead notification emails are required by PRODUCT_SPEC.md Section 19 — if
this is wrong, leads are captured but nobody is told. (The dashboard now
flags such leads, but only once the contractor happens to log in.)

## 5. Application environment variables

```
NEXT_PUBLIC_SUPABASE_URL=      # hosted project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only, never NEXT_PUBLIC_
ANTHROPIC_API_KEY=
APP_URL=                       # real domain, NOT localhost
```

`APP_URL` builds the "view this lead" links in notification emails and
texts. Left on localhost, every one of those links is dead. The app logs a
loud `[config]` error at startup in production for this and the other
silent-failure settings (`src/lib/config-check.ts`) — **check the logs after
your first deploy.**

## 6. Rate limiting depends on your host

Abuse protection on the public widget identifies callers by IP. That is
spoof-proof behind **Vercel** or **Cloudflare** (the app prefers their edge
headers, which clients can't forge). Behind your own nginx, you must set:

```
proxy_set_header X-Forwarded-For $remote_addr;
```

Exposed directly to the internet, a caller can send a fresh `X-Forwarded-For`
per request and bypass the per-IP limits entirely. The per-business lead
ceiling (`RATE_LIMITS.leadsPerBusiness`) still holds regardless, so a
contractor can't be buried — but the Anthropic-backed classification
endpoint would be open to cost abuse. See `src/lib/rate-limit/get-client-ip.ts`.

## 7. Twilio (optional — SMS is additive to the required email)

Two values are commonly mixed up here:

- `TWILIO_ACCOUNT_SID` must start with **`AC`** — it's on the Console
  dashboard under "Account Info". A value starting with `SK` is an **API Key
  SID** from a different page and will not work.
- `TWILIO_FROM_NUMBER` must be a number **Twilio issued to your account**
  (Phone Numbers → Manage → Active Numbers). Twilio cannot send from a
  personal cell number it doesn't control.

Leave all three unset and SMS is skipped cleanly; email still works.

## 8. Error monitoring (optional)

```
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG= SENTRY_PROJECT= SENTRY_AUTH_TOKEN=   # only for source maps
```

If you set `SENTRY_AUTH_TOKEN`, run `pnpm approve-builds` once so
`@sentry/cli` may run its postinstall script.

## 9. Legal pages

The app collects homeowner name, phone, email, and service address. Terms
and a Privacy Policy are needed before it's publicly reachable. Not
scaffolded here deliberately — placeholder legal text is worse than none.

## 10. Billing

PRODUCT_SPEC.md Section 26 sets $27/month. Nothing in the app charges
anyone. For the first few contractors this is usually handled manually (a
Stripe Payment Link or an invoice) rather than built in.

To suspend a non-paying or abusive contractor, set `businesses.is_active` to
`false`. That takes their widget and all previously-issued shareable
estimate links offline immediately without touching any of their data;
setting it back to `true` restores everything.

---

## Before sending the URL to a real person

Do the whole flow yourself, on the production URL, in one sitting:

1. Sign up with a real email address you can check.
2. Click the confirmation link — you should land **logged in**, on onboarding.
3. Complete onboarding, pick a service, set pricing, activate it.
4. Open the public widget URL and submit an estimate as a homeowner.
5. Submit contact details as that homeowner.
6. Confirm the notification email actually arrives, and that the "view this
   lead" link in it opens the lead.
7. Log out and run a password reset end to end.

Steps 2 and 6 are the ones that break on a fresh deploy, and both fail
quietly.
