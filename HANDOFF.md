# Handoff — Instant Estimate, 2026-08-22

Written at the end of a long working session because Claude access is ending today.
Everything below is accurate as of this commit — verified against actual code, git
history, and the local database, not recalled from memory.

## TL;DR

- All of today's work is **committed and pushed** to branch `feat/marketing-route-group`.
  **No PR is open yet** — you need to open one against `main` (see "Git state" below).
- **Gate 2 (the full contractor → customer → lead loop) is now fully proven live
  in the browser, start to finish, including photo upload** — signup → email
  confirmation → onboarding → service selection → pricing → activation →
  `/dashboard/widget` → the public `/e/[slug]` estimator → real OpenAI
  classification → real computed estimate ($225–$325) → contact form with 2
  uploaded photos → lead created → visible on the dashboard → full lead detail
  page with photos rendering. Every step was clicked through by hand and
  screenshotted, not inferred. See section 5.
- Browser automation (Claude-in-Chrome) **was flaky earlier in this session and
  then started working again after the user re-added/reauthorized the
  extension** — if a future session hits the same "frame showing error page" /
  "not connected" symptoms described in section 9, that's the first thing to
  try before assuming it's a code problem.
- The Anthropic API key ran out of balance mid-session; AI classification now runs
  on OpenAI instead. This is done, committed, and verified against the real API.
- One real bug was found and fixed along the way (`next.config.ts` was missing
  `allowedDevOrigins`, silently breaking hydration for a specific dev workflow) —
  worth knowing about since it looked like a component bug at first and wasn't.

---

## 1. What this project is

Instant Estimate: an embeddable "instant estimate" widget + lead-capture platform
for home-service businesses. Plumbing is the only vertical in scope for the MVP.
Core architectural principle (do not violate this):

> AI interprets the homeowner. The pricing engine determines the price.

AI (now OpenAI, see below) only classifies which configured service a homeowner's
free-text description matches. It never sees or influences a price. Pricing is a
deterministic engine (`src/lib/pricing/engine.ts`) driven entirely by contractor-
configured rules. Full spec: `CLAUDE.md` → `docs/PRODUCT_SPEC.md` →
`docs/PRICING_ENGINE_SPEC.md`. Read those before making product decisions — they
are the source of truth, not this file.

## 2. Git state — read this before doing anything else

```
main                                          — 3bf97df, up to date with origin
feat/marketing-route-group (current branch)   — 6 commits ahead of origin's main,
                                                 pushed to origin, NO PR OPEN YET
fix/checkbox-nativebutton-and-money-inputs    — fully merged into the branch above
                                                 (via a merge commit); safe to
                                                 delete/ignore once the PR below
                                                 merges — don't open a separate PR
                                                 for it, it'd be redundant
```

`feat/marketing-route-group` contains **everything** from this session, already
merged together in the right order:

1. `refactor: separate marketing route from application` — `/` moved into a
   `(marketing)` route group, `/dashboard` unaffected
2. `fix: Base UI button link semantics and unlabeled price inputs` (from the other
   branch, merged in)
3. `feat: redesign marketing hero and content sections` — the full landing page
4. `fix: allow 127.0.0.1 as a dev origin for browser automation tooling`
5. `feat: replace Anthropic classifier with OpenAI`
6. `fix: use sibling Checkbox+FieldLabel pattern in service selection`

**Next action for whoever picks this up**: open a PR from `feat/marketing-route-group`
into `main` — `gh pr create --base main --head feat/marketing-route-group`, or
visit `https://github.com/stevechez/instant-estimate/pull/new/feat/marketing-route-group`.
Nothing is blocking that merge; typecheck/build/tests all pass on this branch as-is.

## 3. Environment setup (if starting fresh)

This repo uses **pnpm**, not npm (`npm install` will error — use `pnpm install`).

```
supabase start          # local Postgres/Auth/Storage/Mailpit via Docker
                         # (Docker Desktop must be running first)
pnpm dev                # or: npm run dev — package.json script name, npm run is fine
                         #     for scripts, just not for installing packages
```

`.env.local` already has real local Supabase keys (`supabase start` prints them,
regenerate with `supabase status -o env` if they ever drift). It also already has
a working `OPENAI_API_KEY` (added this session) and a commented-out
`ANTHROPIC_API_KEY` (dead, no longer read by any code, left in place harmlessly).

**Known dev-environment gotcha, already fixed once**: if `next.config.ts`'s
`allowedDevOrigins` ever gets reverted/lost, any browser-automation tool that
reaches the dev server via `127.0.0.1` instead of `localhost` will silently fail
to hydrate (page HTML loads fine, all client interactivity — buttons, checkboxes,
forms — silently does nothing). Looks exactly like a broken component. It isn't.
Check `next.config.ts`'s `allowedDevOrigins` array first if that ever happens again.

**Known dev-environment gotcha #2**: Next.js signs Server Action references per
server process. If you restart `next dev` while a browser tab is still open on an
old page load, submitting any form on that stale tab throws `Uncaught Error: An
unexpected response was received from the server.` Fix is always the same: hard
refresh the page, not a code change.

## 4. Beta plan status (the 5-gate plan from earlier this session)

**Gate 1 (freeze the core)** — effectively already true. Pricing engine, classifier,
and widget flow haven't needed independent changes; fail-closed behavior is
verified at every layer (see Gate 3 table below). Nothing to build here.

**Gate 2 (prove contractor → customer → lead loop)** — **this is the unfinished
piece, see section 5 below.** Every step exists in code and most have been
verified against the database from a fresh test signup done today. The loop is
not yet proven complete because the walkthrough stalled at the widget/estimate
step (test environment issue, not a code issue — see below).

**Gate 3 (beta safety questions)** — ✅ **closed, 8 of 8.** All correct by
design or now fixed:

| Question | Behavior |
|---|---|
| AI can't identify a service | `quote_required`, homeowner can still leave contact info |
| Service has no active pricing | Same fallback path |
| Nonsense input | `<3` chars short-circuits before any API call; system prompt instructs `null` on anything unclear |
| Extremely complex job | System prompt explicitly lists out-of-scope categories (sewer line, repiping, slab leaks, gas work) |
| OpenAI fails | Try/catch → `serviceKey: null`, fully fail-closed — verified live |
| Customer submits twice | `leads_one_per_estimate_idx` unique constraint; Postgres `23505` returns success without a duplicate notification |
| Contractor changes price after an estimate | Safe by construction — `estimates` stores its own price snapshot at calculation time |
| Customer abandons mid-flow | **Fixed** (migration `20260822120000_abandoned_estimate_retention.sql`): lead-less `estimates` rows are now deleted after 30 days, via the same in-function-call pattern as the existing rate-limit cleanup (no cron needed). Privacy Policy's "How long we keep things" updated to state this. Verified live: backdated a real orphaned estimate to 31 days old, triggered `check_rate_limit` through an actual browser submission on the public widget, confirmed via DB that only the backdated row was deleted — two recent orphaned estimates, two real leaded estimates, and the brand-new estimate from the test submission itself were all correctly left alone. |

**Gate 4 (contractor experience)** — closer than expected. `dashboard/page.tsx`
already shows active/inactive services with pricing status and the 10 most recent
leads. Real gap: the leads list only shows name/status/date, not service type or
estimate $ amount inline — not the full table you sketched.

**Gate 5 (instrumentation)** — ✅ **done.** New `business_events` table +
`src/lib/events/track.ts` (fire-and-forget, never blocks the caller), wired
into all 7 named events at their real call sites in
`src/app/e/[slug]/actions.ts`: `estimate_started`, `service_classified`,
`service_unmatched`, `estimate_completed`, `estimate_unmatched`,
`estimate_failed`, `lead_submitted`. `service_unmatched` carries the
homeowner's raw description — the actual "what don't we understand" data.
90-day retention, same in-function pattern as the Gate 3 fix, not
privacy-policy-governed (no more PII than `estimates` already carries).
Verified live in the browser twice: a matching run produced
`estimate_started → service_classified → estimate_completed → lead_submitted`
with real IDs attached; a non-matching run produced `estimate_started →
service_unmatched (with the exact typed description) → estimate_unmatched`.
One known, disclosed scope limit: `classifyServiceFromDescription`'s
contract (explicitly preserved in an earlier task) can't currently
distinguish "OpenAI failed" from "model said no match" — both count as
`service_unmatched` today. Separating them would need a small additive
change to that return type; not done unilaterally, flagged as a follow-up.
No dashboard UI reads this table yet — it's meant to be queried directly
with SQL for now (`select event_type, count(*) from business_events group
by event_type`), matching "a small number of events, not a giant analytics
system."

## 5. Gate 2 — the full loop, now proven live, twice, two different ways

There are **two separate pieces of evidence** this loop works, from two different
test businesses. Together they're about as thorough a proof as this gate needs
before beta. No further re-verification of the basic loop should be necessary —
if you're picking this up next, move on to Gates 3–5 unless something regresses.

### 5a. Full live browser walkthrough (the definitive one)

Once the Claude-in-Chrome extension was reconnected and reauthorized (see
section 9), the entire loop was clicked through by hand, screenshotted at every
step, on a fresh account:

- **Business**: "Browser Test Plumbing" (`slug: browser-test-plumbing`), owner
  `browsertest.instantestimate@example.com` (test account; password only exists
  in this session's action history, not recorded anywhere — recreate a new test
  account rather than trying to recover it)
- Signup → confirmation link pulled from the real Mailpit API (not clicked
  through the Mailpit UI — `GET http://127.0.0.1:54324/api/v1/messages`) → auto
  logged in on confirm → `Tell us about your business` → service selection
  (confirmed the `Checkbox`/`FieldLabel` sibling-pattern fix toggles correctly
  on the very first click) → pricing ($275 starting price on Repair) → **Save
  pricing** → **Activate service** → dashboard shows "Active" → `/dashboard/widget`
  shows both the shareable link and embed snippet → the actual public
  `/e/browser-test-plumbing` page → typed `faucet is leaking under kitchen sink`
  → real OpenAI call classified it as Faucet Repair/Replacement → **real
  computed estimate: $225–$325** → contact form filled in (name, phone, email,
  address) → **2 real test photos uploaded through the actual file input** →
  submitted → "You're all set" → back on the dashboard, the lead appears
  ("Jordan Browser · new") → opened the lead detail page → full contact info,
  the $225–$325 estimate, the homeowner's description, and **both uploaded
  photos rendering** were all present and correct.

Every one of these was an actual click/type/screenshot, not inferred. Confirmed
in the DB afterward too: `leads` row `cfa6e2a4-f9b4-443c-a2c9-0d5639a9a315`,
2 rows in `estimate_photos`.

### 5b. Earlier script-based verification (a second, independent business)

Before the browser started cooperating, the same loop's estimate/photo/lead
segment was proven a different way, against a second test business ("clmv
site", `slug: clmv-site`, owner `clmvhouse@yahoo.com` — created via the actual
signup/onboarding UI, password unknown, typed directly by the user): a
throwaway script called the real OpenAI Responses API (same request shape
`classify-service.ts` makes) and imported the **real, unguarded** pricing code
directly (`src/lib/pricing/engine.ts`, `from-db.ts` — neither has a
`server-only` guard, by design, since the engine needs to work outside a
request context), then wrote to `estimates`, `estimate_photos`, and `leads`
with the exact shape `submitEstimate()`/`uploadEstimatePhotos()`/`submitLead()`
use. Result: `estimates` row `a5e69188-f302-43bf-826f-3e53a88d5d35` (classified
faucet, priced $250–$325 off the same $275 starting price), 3 uploaded photos,
`leads` row `f106fd8b-3902-4e3c-bd1a-9c0a276dfe08` — all confirmed visible via
the exact queries `dashboard/page.tsx` and `dashboard/leads/[leadId]/page.tsx`
run.

(`src/app/e/[slug]/actions.ts` and `lib/openai/classify-service.ts` both start
with `import "server-only"`, which only resolves inside Next's bundler — no such
package exists in `node_modules`, Next aliases it internally — so they can't be
imported directly from a standalone script. That's why 5b replicated the
request shape instead of importing those two files directly.)

### Test photo files

If you want to re-test the photo upload field by hand: 3 valid small PNGs were
generated at
`/private/tmp/claude-501/-Users-stevechez-Projects-instant-estimate/fd914982-c645-4c2d-8b5b-9929c5583e15/scratchpad/test-photos/`
(session-specific scratchpad, may not survive — any 3 small real image files
work fine; the form only requires `image/*` and ≤8MB).

To check DB state directly at any point:
```
docker exec -i supabase_db_home-services-estimator psql -U postgres -d postgres -c "
select * from leads order by created_at desc limit 5;
"
```

## 6. Files changed this session (all committed, see git log for full detail)

- `src/app/(marketing)/*` — full landing page: hero + 5 content sections, each a
  distinct component (`hero-widget.tsx`, `mechanism-strip.tsx`, `pricing-demo.tsx`,
  `integration-demo.tsx`, `mobile-demo.tsx`, `lead-card.tsx`)
- `src/lib/openai/` (new) — replaces `src/lib/anthropic/` (deleted). Same exported
  function signature (`classifyServiceFromDescription`), same fail-closed
  contract, now calling OpenAI's Responses API on `gpt-5.4-mini`
- `src/app/e/[slug]/actions.ts` — one import path change for the above
- `src/lib/config-check.ts` (+ test) — production startup check now looks for
  `OPENAI_API_KEY` instead of `ANTHROPIC_API_KEY`
- `src/app/onboarding/services/service-selection-form.tsx` — Checkbox/FieldLabel
  now siblings instead of nested (requested change; the actual root cause of the
  reported "not clickable" bug was the `allowedDevOrigins` issue below, not this)
- `next.config.ts` — added `allowedDevOrigins: ["127.0.0.1"]`
- `.env.example`, `package.json`, `pnpm-lock.yaml` — `OPENAI_API_KEY` placeholder,
  `openai` package added (`@anthropic-ai/sdk` still installed but unused, not
  removed)

## 7. Things I'd explicitly flag as not-yet-done, so they aren't mistaken for bugs

- Toilet and Water Heater services on the test business are intentionally
  inactive (never priced) — the AI correctly returns unmatched for anything
  classified as those, that's not a classification failure.
- No leads-list table with service/estimate columns yet (Gate 4 gap, see above).
- ~~No business-event analytics yet~~ — done, see Gate 5 above. No dashboard UI reads it yet, by design (query directly with SQL for now).
- ~~No retention/cleanup for abandoned mid-flow `estimates` rows~~ — fixed, see Gate 3 above.
- `@anthropic-ai/sdk` is still in `package.json`, unused. Fine to remove whenever,
  just wasn't asked for this session.

## 8. Working style notes for whoever continues this

- This session ran under a strict "smallest safe change, ask before assuming"
  discipline — every fix was scoped tightly, verified with `tsc`/`build`/`vitest`
  before being called done, and commits were only made when explicitly asked for.
  I'd recommend continuing that pattern; the codebase has a lot of deliberate,
  documented design decisions in code comments (read them before "fixing"
  something that looks odd — several things that looked like bugs this session
  turned out to be intentional, and one thing that looked intentional turned out
  to be a real bug).
- Prices and identifiers used in test data throughout the marketing page and this
  session's manual testing (`Sarah's Plumbing`, `Sarah M.`, `$150–$250`, `$275`)
  are all fictional/test values, not real product pricing guidance.

## 9. Browser automation status — resolved, but here's the history

The Claude-in-Chrome extension could not reliably drive this app for most of
this session, in two different failure modes:

1. Early on: it would connect and the dev server would answer with real `200`s
   (confirmed in server logs), but the extension's screenshot/text-extraction
   would report `Frame with ID 0 is showing error page` — most likely a
   dev-only asset/HMR origin mismatch (the same class of issue
   `allowedDevOrigins` was added to fix, possibly recurring under a different
   origin/timing, never fully root-caused).
2. Later: the extension stopped connecting at all (`Browser extension is not
   connected`), independent of the dev server or the app.

The user confirmed their **normal Chrome browser on the same machine loads the
app fine** throughout — this was specific to the automated/extension-driven
browser in this tool session, not the app, not the network, not Docker/Supabase.

**Resolution**: the user removed and re-added the Claude-in-Chrome extension and
reauthorized it, and it started working normally afterward — full page loads,
screenshots, form input, and file uploads all worked correctly for the rest of
the session (see section 5a's full live walkthrough, done entirely through this
now-working browser tooling). **If a future session hits either failure mode
above, try that first** — remove/re-add the extension and reauthorize — before
spending time on `allowedDevOrigins`-style theories or assuming it's a code
problem. It very well might just be the extension's connection state.

The throwaway-script verification approach (section 5b) remains a legitimate,
high-confidence fallback for anything that doesn't strictly require exercising
React UI code, and is worth keeping in mind even with a working browser —
it's often faster for pure backend/data verification.
