-- Gate 3 beta-safety gap (see HANDOFF.md "Customer abandons mid-flow"):
-- submitEstimate()/submitUnmatchedEstimate() write an `estimates` row as soon
-- as a price is calculated, before the homeowner ever reaches the contact
-- step. A homeowner who closes the tab there leaves a row with no lead
-- attached, forever, with nothing cleaning it up. It carries no contact PII
-- (name/phone/email only exist once a lead is created), but it does carry
-- the homeowner's free-text description, and "nothing deletes these, ever"
-- is exactly the kind of unbounded retention the existing rate-limit cleanup
-- migration (20260820170000) was written to avoid.
--
-- Same pattern as that migration, for the same reason: cleanup runs inside
-- check_rate_limit() rather than depending on pg_cron, so it works
-- identically on local, hosted, and any future environment with no
-- extension or scheduler to configure. It is a deterministic delete on
-- every call, not a probabilistic one.
--
-- 30 days, matching the rate-limit retention window already in place —
-- ample time for a homeowner to come back to an in-progress estimate (there
-- is no resume-later feature, so in practice this window is generous, not
-- tight). An estimate that already has a lead is never touched, regardless
-- of age — leads and their estimates are kept for as long as the account is
-- open, per the Privacy Policy, and that policy is updated in this same
-- commit to describe this new, narrower deletion.
--
-- If traffic ever makes the per-call delete meaningful, move it to a
-- scheduled job — but change the Privacy Policy in the same commit if the
-- guarantee changes.

create index estimates_created_at_idx on estimates (created_at);

-- Supporting an index scan for the NOT EXISTS check below: leads.estimate_id
-- already has an index (leads_estimate_id_idx, from the init migration), so
-- nothing more to add here.

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
  -- Retention: see docs/legal/PRIVACY.md ("Technical information").
  delete from rate_limit_windows where window_start < now() - interval '30 days';

  -- Retention: see docs/legal/PRIVACY.md ("How long we keep things") — an
  -- estimate nobody ever turned into a lead is deleted after 30 days.
  -- Estimates attached to a real lead are never touched here.
  delete from estimates
  where created_at < now() - interval '30 days'
    and not exists (select 1 from leads where leads.estimate_id = estimates.id);

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into rate_limit_windows (bucket_key, window_start, hit_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set hit_count = rate_limit_windows.hit_count + 1
  returning hit_count into v_count;

  return v_count <= p_limit;
end;
$$;

comment on function check_rate_limit is 'Atomically increments the fixed-window counter for bucket_key and returns whether this hit is still within p_limit. Also deletes rate-limit records older than 30 days and abandoned (lead-less) estimates older than 30 days — both retention periods stated in the Privacy Policy.';

comment on table estimates is 'One row per calculated estimate (PRICING_ENGINE_SPEC.md). Rows with no matching leads.estimate_id are deleted after 30 days by check_rate_limit() — see docs/legal/PRIVACY.md ("How long we keep things"). Rows with a lead are kept for as long as the account is open, same as the lead itself.';

-- The function was replaced, so its grants were reset to the Postgres default
-- of EXECUTE TO PUBLIC. Re-apply the explicit narrowing from
-- 20260820140000_integrity_hardening.sql.
revoke all on function check_rate_limit(text, int, int) from public;
grant execute on function check_rate_limit(text, int, int) to service_role;
