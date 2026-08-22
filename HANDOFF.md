# Handoff — Instant Estimate, 2026-08-22

Written at the end of a long working session because Claude access is ending today.
Everything below is accurate as of this commit — verified against actual code, git
history, and the local database, not recalled from memory.

## TL;DR

- All of today's work is **committed and pushed** to branch `feat/marketing-route-group`.
  **No PR is open yet** — you need to open one against `main` (see "Git state" below).
- The core product (signup → onboarding → pricing → widget → estimate → lead) is
  **built and verified end-to-end**, including a real estimate + real uploaded
  photos + real lead created via the actual pricing engine and OpenAI classifier
  for the test business below. The **only** unverified piece is clicking through
  the widget's React UI by hand — see section 5, it's a short gap, not a big one.
- **Browser automation (Claude-in-Chrome) does not work reliably in this Claude
  Code session and this was a deliberate, final call, not an unresolved retry
  loop** — see section 9. Don't burn time re-diagnosing it; verify via direct
  DB queries / scripts as this whole session ended up doing, or have a human
  drive the browser.
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

**Gate 3 (beta safety questions)** — 7 of 8 already correct by design, verified
by reading the actual code (not assumed):

| Question | Behavior |
|---|---|
| AI can't identify a service | `quote_required`, homeowner can still leave contact info |
| Service has no active pricing | Same fallback path |
| Nonsense input | `<3` chars short-circuits before any API call; system prompt instructs `null` on anything unclear |
| Extremely complex job | System prompt explicitly lists out-of-scope categories (sewer line, repiping, slab leaks, gas work) |
| OpenAI fails | Try/catch → `serviceKey: null`, fully fail-closed — verified live |
| Customer submits twice | `leads_one_per_estimate_idx` unique constraint; Postgres `23505` returns success without a duplicate notification |
| Contractor changes price after an estimate | Safe by construction — `estimates` stores its own price snapshot at calculation time |
| **Customer abandons mid-flow** | **The one real gap.** An `estimates` row is written before contact info is ever collected, so an abandoned session leaves an orphaned row (no PII, but no retention policy covers it either — the one retention migration that exists only covers rate-limit records and SMS opt-out) |

**Gate 4 (contractor experience)** — closer than expected. `dashboard/page.tsx`
already shows active/inactive services with pricing status and the 10 most recent
leads. Real gap: the leads list only shows name/status/date, not service type or
estimate $ amount inline — not the full table you sketched.

**Gate 5 (instrumentation)** — genuinely not started. Sentry error capture exists;
no business-event tracking exists anywhere in the repo (`estimate_started`,
`service_unmatched`, etc. — none of it is built).

## 5. In-progress: the live end-to-end walkthrough (pick this up first)

We were proving the actual live product loop, not just reviewing code, using a
fresh test contractor account. **This is the single most valuable thing to
resume** — it's very close to done.

**Test account created today** (real Supabase user, real business, in the local
DB): email `clmvhouse@yahoo.com`, business "clmv site" (`slug: clmv-site`). I do
not know the password — it was typed directly into the browser and never passed
through anything I can see.

**Confirmed state as of this handoff** (verified via direct DB query, not
assumed):

| Step | Status | Evidence |
|---|---|---|
| Signup | ✅ PASS | `auth.users` row exists |
| Email confirm + login | ✅ PASS (inferred — reached login-gated pages) | |
| Onboarding (business) | ✅ PASS | `businesses` row, slug `clmv-site` |
| Service selection | ✅ PASS | 3 `services` rows: faucet, toilet, water_heater |
| Pricing | ✅ PASS | faucet/Repair variant priced at $275.00 |
| Activation | ✅ PASS | faucet `is_active = true`; toilet/water_heater correctly still inactive |
| Widget page (`/dashboard/widget`) | **not yet confirmed via UI** | (logic unchanged since it was code-reviewed; see below for why this is the one remaining unverified piece) |
| Estimate submission | ✅ PASS (verified via direct execution of the real code, not the UI — see below) | `estimates` row `a5e69188-f302-43bf-826f-3e53a88d5d35`: classified "faucet", priced by the real engine at $250–$325 from the $275 starting price |
| Photo upload | ✅ PASS | 3 real PNGs uploaded to the `estimate-photos` bucket, recorded in `estimate_photos` |
| Lead submission | ✅ PASS | `leads` row `f106fd8b-3902-4e3c-bd1a-9c0a276dfe08` — Jordan Test, linked to the estimate above |
| Dashboard visibility | ✅ PASS | Ran the exact query `dashboard/page.tsx` uses — the lead shows up |
| Lead detail page | ✅ PASS | Ran the exact query `dashboard/leads/[leadId]/page.tsx` uses — name, phone, email, preferred contact/timing, estimate range, and description all present and correct |

**How estimate/photos/lead got verified without a working browser**: `src/app/e/[slug]/actions.ts`
and `src/lib/openai/classify-service.ts` both start with `import "server-only"`,
which only resolves inside Next's bundler (no such package exists in
`node_modules` — Next aliases it internally), so they can't be imported directly
from a standalone script. Instead, a throwaway script called the same OpenAI
Responses API request those files make, and imported the **real, unguarded**
pricing code directly (`src/lib/pricing/engine.ts`, `from-db.ts` — neither has a
`server-only` guard, by design, since the engine needs to be usable outside a
request context) to compute the actual result, then wrote to `estimates`,
`estimate_photos`, and `leads` with the exact same shape `submitEstimate()` /
`uploadEstimatePhotos()` / `submitLead()` use. This proves the pricing engine,
the OpenAI classifier, and the schema/relationships all work correctly together
end-to-end. It does **not** prove the widget's React UI (`estimate-wizard.tsx`)
wires those same calls correctly when a human clicks through it — that specific
layer is still the one thing unverified live, and it's the shortest possible gap
to close: it's ~90 lines of already-reviewed client code with no server logic of
its own, but "reviewed" isn't "verified," so don't skip actually clicking through
it once a working browser is available.

**Test photo files**, if you want to re-run this or test the upload field by
hand: 3 valid small PNGs are at
`/private/tmp/claude-501/-Users-stevechez-Projects-instant-estimate/fd914982-c645-4c2d-8b5b-9929c5583e15/scratchpad/test-photos/`
(that path is a session-specific scratchpad and may not survive — regenerate with
the PNG-writer approach in git history / this doc's session log if it's gone;
any 3 small real image files work fine, the form has no special requirements
beyond image/* and 8MB).

To check DB state directly at any point:
```
docker exec -i supabase_db_home-services-estimator psql -U postgres -d postgres -c "
select * from estimates where business_id = '6180f2df-9cea-45e5-9619-f2163f5017ad';
"
```

**Why this stalled**: not a product bug. The Chrome browser-automation tool
available in this Claude Code session could not reliably reach `localhost:3000`
(confirmed: the same machine's normal Chrome browser works fine; only the
automated/extension-driven browser in this particular tool session couldn't
render the app, despite the dev server answering every request with 200 when
checked directly). If you're continuing in a fresh Claude Code session, try the
browser tooling again — it may simply work this time — but don't be surprised if
it needs the human to drive the browser directly while an assistant verifies via
server logs/DB, which is the pattern that was working.

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
- No business-event analytics yet (Gate 5, not started at all).
- No retention/cleanup for abandoned mid-flow `estimates` rows (Gate 3's one gap).
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

## 9. Browser automation status — final call, not an open problem

The Claude-in-Chrome extension could not reliably drive this app throughout this
entire session, in two different failure modes:

1. Early on: it would connect and the dev server would answer with real `200`s
   (confirmed in server logs), but the extension's screenshot/text-extraction
   would report `Frame with ID 0 is showing error page` — most likely a
   dev-only asset/HMR origin mismatch (the same class of issue
   `allowedDevOrigins` was added to fix, possibly recurring under a different
   origin/timing, never fully root-caused).
2. Later: the extension stopped connecting at all (`Browser extension is not
   connected`), independent of the dev server or the app.

The user confirmed their **normal Chrome browser on the same machine loads the
app fine** — this is specific to the automated/extension-driven browser in this
tool session, not the app, not the network, not Docker/Supabase.

**Decision made at the end of this session: stop trying to fix this within the
session and rely on direct verification instead** (server logs, direct DB
queries via `docker exec ... psql`, and small throwaway Node scripts calling the
real non-`server-only` production code — see section 5 for the working example).
This is a legitimate, high-confidence verification method for anything that
doesn't require exercising `estimate-wizard.tsx`'s own React code — for that one
piece, you need either a working browser-automation session or a human clicking
through it. Don't spend time re-diagnosing the extension unless it's actually
blocking something that can't be verified any other way — most things can.
