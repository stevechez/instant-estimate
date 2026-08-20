-- Make businesses.is_active mean something.
--
-- It was dead: nothing read it, nothing wrote it, it defaulted to false, and
-- both the schema comment and the widget loader claimed an enforcement that
-- did not exist. The previous migration documented that honestly; this one
-- actually wires it up, because "suspend a contractor" (non-payment, abuse,
-- a support request) is a real near-term need and there is currently no way
-- to do it short of deleting their account.
--
-- Order matters: backfill every existing row to true BEFORE any code starts
-- filtering on it, or every widget that works today goes dark. Onboarding
-- now sets it explicitly on insert (see app/onboarding/business/actions.ts)
-- and the default flips to true so a business is live from creation —
-- serving estimates still additionally requires at least one active service.
update businesses set is_active = true where is_active = false;

alter table businesses alter column is_active set default true;

comment on column businesses.is_active is 'Master switch for whether this business serves anything publicly. False takes the widget and all shareable estimate links offline immediately, without touching their data — the suspend/reinstate lever for non-payment or abuse. Serving estimates additionally requires at least one active service.';
