-- Rate limiting for the public, unauthenticated estimate widget
-- (app/e/[slug]) — protects against Anthropic API cost abuse (classify) and
-- lead/email/SMS spam (submitLead). Postgres-backed rather than in-memory
-- so limits hold regardless of deployment topology (correct whether this
-- runs as one long-lived process or many serverless instances), and
-- Postgres rather than Redis so no new external account/credentials are
-- needed — this is the database the app already has.
--
-- Never touched by anon/authenticated directly — only via check_rate_limit(),
-- called from server actions using the service-role client (see
-- lib/rate-limit/check.ts). RLS is enabled with no policies (default deny)
-- as defense in depth; no grants are added for anon/authenticated, matching
-- the "not a blanket grant" philosophy in 20260819140000_grants.sql.

create table rate_limit_windows (
  bucket_key text not null,
  window_start timestamptz not null,
  hit_count integer not null default 1,
  primary key (bucket_key, window_start)
);

comment on table rate_limit_windows is 'Fixed-window rate-limit counters, checked/incremented atomically via check_rate_limit(). Old windows are not yet pruned automatically — acceptable at MVP traffic levels (rows are tiny and bounded by distinct IP x action-bucket x window combos); revisit with a scheduled cleanup if this ever grows large.';

alter table rate_limit_windows enable row level security;
-- No policies: default deny for anon/authenticated. Only service_role
-- (bypasses RLS) and this function (security invoker, run as service_role
-- from lib/rate-limit/check.ts) ever touch this table.

-- Atomically increments the counter for (bucket_key, current fixed window)
-- and reports whether this hit is still within the limit. The insert...on
-- conflict...do update...returning is a single statement, so concurrent
-- callers can't race each other into both reading a stale count.
create or replace function check_rate_limit(p_bucket_key text, p_window_seconds int, p_limit int)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into rate_limit_windows (bucket_key, window_start, hit_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set hit_count = rate_limit_windows.hit_count + 1
  returning hit_count into v_count;

  return v_count <= p_limit;
end;
$$;

comment on function check_rate_limit is 'Atomically increments the fixed-window counter for bucket_key and returns whether this hit is still within p_limit. Called via supabase.rpc("check_rate_limit", ...) using the service-role client.';

-- Functions aren't auto-exposed to the Data API roles either (same lesson as
-- 20260819140000_grants.sql) — without this, supabase.rpc() fails with
-- "permission denied for function check_rate_limit".
grant execute on function check_rate_limit(text, int, int) to service_role;
