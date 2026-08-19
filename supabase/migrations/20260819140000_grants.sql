-- Table-level GRANTs for the Data API roles.
--
-- Discovered by actually exercising this schema (not just reading it): as of
-- this Supabase CLI version, newly created tables are no longer
-- auto-exposed to anon/authenticated/service_role (supabase/config.toml,
-- [api] auto_expose_new_tables — the new default matches Supabase Cloud).
-- RLS policies alone are not enough; Postgres checks table-level GRANTs
-- first; without them every query fails with "permission denied for table
-- ...", and the RLS policies in 20260819120000_init_schema.sql never even
-- get evaluated.
--
-- anon deliberately gets nothing here, matching that migration's "no anon
-- policies" design (see its top-of-file architecture note) — the widget
-- reads/writes through server routes using service_role, not directly.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on
  businesses,
  services,
  service_variants,
  questions,
  pricing_modifiers,
  pricing_add_ons,
  pricing_quote_only_rules,
  estimates,
  estimate_photos,
  leads
to authenticated;

grant all on
  businesses,
  services,
  service_variants,
  questions,
  pricing_modifiers,
  pricing_add_ons,
  pricing_quote_only_rules,
  estimates,
  estimate_photos,
  leads
to service_role;

-- Cover tables added by future migrations too, not just the ones that exist today.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;
