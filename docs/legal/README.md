# Legal documents

**The live documents are the application pages**, not this directory:

- `src/app/(legal)/privacy/page.tsx` → `/privacy`
- `src/app/(legal)/terms/page.tsx` → `/terms`

Identity, contact email, governing state, and the effective date are
centralised in `src/lib/legal/meta.ts` so the two pages cannot drift apart.

The earlier `PRIVACY.md` / `TERMS.md` drafts in this directory have been
removed to avoid two sources of truth diverging — an out-of-date markdown copy
of a legal document is worse than no copy.

## Changing these documents

Every factual claim in them was verified against the code. If you change what
the application does, check whether one of these is now untrue. In particular:

| If you change… | Re-check |
|---|---|
| What's sent to Anthropic (`lib/anthropic/`) | Privacy → "The AI part, specifically" |
| Who receives SMS (`lib/sms/`) | Privacy → contractor texts; Terms §6; the settings disclosure |
| Rate-limit storage or retention (`check_rate_limit`) | Privacy → "Technical information" (states 30 days) |
| Abandoned-estimate retention (`check_rate_limit`) | Privacy → "How long we keep things" (states 30 days for lead-less estimates) |
| Account deletion (`lib/account/delete-account.ts`) | Privacy → "How long we keep things"; Terms §8 |
| Adding analytics, tracking, or any cookie | Privacy → "Technical information" (currently states none exist) |
| Sentry config (`sentry.*.config.ts`) | Privacy → "Error reports" |
| Starting to charge | Terms §9 (currently states free during alpha) |
| Sending any marketing email or SMS | Privacy → emails/texts; Terms §6; CAN-SPAM and TCPA obligations change |

Bump `LEGAL_EFFECTIVE_DATE` in `src/lib/legal/meta.ts` for material changes,
and email contractors before the change takes effect — both documents promise
this.

## Not reviewed by an attorney

These were drafted from the codebase, not from a template, and no attorney has
reviewed them. Worth a lawyer's eye before taking real money — particularly the
one-year claims limitation and the governing-law clause.
