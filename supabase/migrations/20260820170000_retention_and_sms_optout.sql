-- Two changes that exist so the Privacy Policy and the SMS disclosure can
-- state something true. Neither is a feature; both close a gap between what
-- the documents say and what the application actually does.

-- ---------------------------------------------------------------------------
-- 1. Rate-limit records are deleted after 30 days
-- ---------------------------------------------------------------------------
-- rate_limit_windows keys its counters by caller IP. Nothing deleted them, so
-- IP-derived records accumulated forever — which the Privacy Policy could not
-- honestly describe as anything but indefinite retention.
--
-- Cleanup runs inside check_rate_limit rather than depending on pg_cron, so
-- it works identically on local, hosted, and any future environment with no
-- extension or scheduler to configure. It is a deterministic delete on every
-- call rather than a probabilistic one: with the index below it is an index
-- scan over a tiny table, and determinism is what lets the policy say "we
-- delete these" without qualification.
--
-- If traffic ever makes the per-call delete meaningful, move it to a
-- scheduled job — but change the Privacy Policy in the same commit if the
-- guarantee changes.

create index rate_limit_windows_window_start_idx on rate_limit_windows (window_start);

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

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into rate_limit_windows (bucket_key, window_start, hit_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set hit_count = rate_limit_windows.hit_count + 1
  returning hit_count into v_count;

  return v_count <= p_limit;
end;
$$;

comment on function check_rate_limit is 'Atomically increments the fixed-window counter for bucket_key and returns whether this hit is still within p_limit. Also deletes rate-limit records older than 30 days, which is the retention period stated in the Privacy Policy.';

comment on table rate_limit_windows is 'Fixed-window rate-limit counters, checked/incremented atomically via check_rate_limit(). Keyed by caller IP for the public widget. Records older than 30 days are deleted by check_rate_limit() itself — see docs/legal/PRIVACY.md.';

-- The function was replaced, so its grants were reset to the Postgres default
-- of EXECUTE TO PUBLIC. Re-apply the explicit narrowing from
-- 20260820140000_integrity_hardening.sql.
revoke all on function check_rate_limit(text, int, int) from public;
grant execute on function check_rate_limit(text, int, int) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Record when Twilio reports a number has opted out
-- ---------------------------------------------------------------------------
-- Twilio handles STOP itself for US long codes and toll-free numbers: once a
-- contractor replies STOP, Twilio blocks further messages to that number and
-- rejects our send with error 21610. Until now the app never noticed — the
-- settings page kept showing a phone number as though texts were being
-- delivered, when Twilio was silently dropping them.
--
-- This column is NOT a local opt-in/opt-out state competing with Twilio's.
-- Twilio remains the authority on whether a number is subscribed; this only
-- records the moment Twilio told us it wasn't, so the contractor-facing UI
-- can stop implying that SMS is working. Cleared whenever the contractor
-- saves a different number.
alter table businesses
  add column sms_opted_out_at timestamptz;

comment on column businesses.sms_opted_out_at is 'When Twilio last rejected a message to notification_phone as opted out (error 21610). Display only — Twilio, not this column, decides whether a number receives messages. Cleared when notification_phone changes. Re-subscribing is done by texting START to the sending number, which we cannot do on the contractor''s behalf.';
