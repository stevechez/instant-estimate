-- Pre-alpha integrity hardening. Each constraint here encodes an invariant
-- the application already believed but only enforced (if at all) in app
-- code — see the audit notes on each one.

-- ---------------------------------------------------------------------------
-- 1. One lead per estimate
-- ---------------------------------------------------------------------------
-- The product already treats this as true: the shareable estimate page hides
-- the contact form and says "You've already requested a quote for this
-- estimate" once a lead exists (app/estimate/[shareToken]/data.ts hasLead).
-- But that was a UI-only gate — submitLead() had no such check, so a refresh,
-- a second tab, or a retry after a slow response created another lead, and
-- each duplicate fired another notification email and SMS at the contractor.
-- Verified: 5 concurrent inserts against one estimate all succeeded.
--
-- Partial, because leads.estimate_id is nullable (on delete set null): only
-- rows still attached to an estimate participate in the constraint.
create unique index leads_one_per_estimate_idx
  on leads (estimate_id)
  where estimate_id is not null;

comment on index leads_one_per_estimate_idx is 'At most one lead per estimate. submitLead() treats a conflict here as success (the homeowner''s request was already received) rather than surfacing an error — see app/e/[slug]/actions.ts.';

-- ---------------------------------------------------------------------------
-- 2. Estimate rows must be internally coherent
-- ---------------------------------------------------------------------------
-- estimates.status and the price columns could disagree: a row with
-- status='estimated' was accepted with NULL prices, or with low > high.
-- Only server-side code writes estimates today and it gets this right, so
-- this is defense in depth — but the estimate range is the product's core
-- promise to the homeowner, and a malformed row would be rendered as a real
-- price. Cheap insurance against a future code path getting it wrong.
alter table estimates
  add constraint estimates_prices_match_status check (
    case status
      when 'estimated' then
        low_price_cents is not null
        and high_price_cents is not null
        and low_price_cents >= 0
        and high_price_cents >= low_price_cents
      when 'fixed' then
        fixed_price_cents is not null
        and fixed_price_cents >= 0
      when 'quote_required' then
        low_price_cents is null
        and high_price_cents is null
        and fixed_price_cents is null
      else false
    end
  );

-- ---------------------------------------------------------------------------
-- 3. Bound free-text input
-- ---------------------------------------------------------------------------
-- Every user-supplied text column was unbounded: a 1MB string in each of the
-- lead's five text fields was accepted. The server actions now cap these
-- (app/e/[slug]/actions.ts), so these constraints are the backstop rather
-- than the primary defense. Limits are generous — far above any legitimate
-- value — so they only ever fire on abuse, never on a real homeowner.
alter table leads
  add constraint leads_text_lengths check (
    length(name) <= 200
    and length(phone) <= 40
    and (email is null or length(email) <= 320)
    and (preferred_contact_method is null or length(preferred_contact_method) <= 100)
    and (preferred_service_timing is null or length(preferred_service_timing) <= 200)
  );

alter table estimates
  add constraint estimates_text_lengths check (
    (homeowner_description is null or length(homeowner_description) <= 5000)
    and (service_address is null or length(service_address) <= 500)
  );

-- ---------------------------------------------------------------------------
-- 4. Functions should not be executable by PUBLIC
-- ---------------------------------------------------------------------------
-- Postgres grants EXECUTE on new functions to PUBLIC by default, so the
-- earlier explicit grants ("... to authenticated" / "... to service_role")
-- narrowed nothing — anon could invoke them. Verified not exploitable today:
-- save_service_pricing is security invoker and died on table permissions
-- ("permission denied for table service_variants"), and is_business_owner
-- only ever reports on the caller's own ownership (auth.uid() is null for
-- anon, so it returns false). Fixing anyway so the boundary is intentional
-- and doesn't depend on a second layer happening to hold.
revoke all on function save_service_pricing(uuid, jsonb) from public;
grant execute on function save_service_pricing(uuid, jsonb) to authenticated;

revoke all on function check_rate_limit(text, int, int) from public;
grant execute on function check_rate_limit(text, int, int) to service_role;

revoke all on function is_business_owner(uuid) from public;
grant execute on function is_business_owner(uuid) to authenticated, service_role;
