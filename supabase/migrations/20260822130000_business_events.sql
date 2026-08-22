-- Gate 5 instrumentation (see HANDOFF.md): a small, fixed set of business
-- events, not a general-purpose analytics system. The concrete goal is
-- answering two kinds of question a contractor or we would actually ask:
-- "why did this business get 20 site visitors but only 12 estimates?" and
-- "what are homeowners typing that Instant Estimate doesn't understand?"
-- Sentry (already integrated) answers "what broke"; this answers "what
-- happened," which Sentry isn't designed for and a giant analytics vendor
-- would be overkill for at this stage.

create table business_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  -- Deliberately a free-standing text column, not an enum: the fixed set of
  -- event types (see src/lib/events/track.ts) lives in application code,
  -- same reasoning as estimates.status using check() rather than a DB enum
  -- elsewhere in this schema being the exception, not the rule — event
  -- types are expected to grow occasionally as new questions come up, and a
  -- text column with an app-level union type is a one-file change instead
  -- of a migration each time.
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table business_events is 'Gate 5 instrumentation: a small, fixed set of funnel events (estimate_started, service_classified, service_unmatched, estimate_completed, estimate_unmatched, estimate_failed, lead_submitted — see src/lib/events/track.ts) written best-effort by the public widget actions. Not a general analytics system; queried directly with SQL for now, not exposed in the dashboard UI yet.';
comment on column business_events.metadata is 'Event-specific detail — e.g. service_unmatched carries the homeowner''s raw description (the "what don''t we understand" question), estimate_completed carries the service/variant. Free-form by design; see track.ts call sites for what each event type actually includes.';

create index business_events_business_id_idx on business_events (business_id);
create index business_events_event_type_idx on business_events (event_type);
create index business_events_created_at_idx on business_events (created_at);

alter table business_events enable row level security;

create policy "owner reads own business events"
  on business_events for select
  using (is_business_owner(business_id));

-- No insert/update/delete policy: written exclusively by server-side widget
-- actions using the service role key, which bypasses RLS — same pattern as
-- estimates and leads.

-- Retention: these are low-value, high-volume by nature (a "started" fires
-- on every widget interaction, matched or not). Piggyback on the same
-- already-frequent, no-cron-needed cleanup pattern as rate_limit_windows and
-- abandoned estimates, both in check_rate_limit(). 90 days, not 30 — funnel
-- analysis benefits from a longer window than "is this still actionable,"
-- which is what the other two cleanups are actually protecting against.
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

  -- Gate 5 instrumentation events are internal/operational, not something
  -- the Privacy Policy needs to describe to homeowners or contractors (no
  -- PII beyond what a service_unmatched event's metadata already echoes
  -- from the estimates table itself, which is separately governed above).
  delete from business_events where created_at < now() - interval '90 days';

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into rate_limit_windows (bucket_key, window_start, hit_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set hit_count = rate_limit_windows.hit_count + 1
  returning hit_count into v_count;

  return v_count <= p_limit;
end;
$$;

comment on function check_rate_limit is 'Atomically increments the fixed-window counter for bucket_key and returns whether this hit is still within p_limit. Also deletes rate-limit records (30 days) and abandoned lead-less estimates (30 days) per the Privacy Policy, and business_events instrumentation rows (90 days, internal-only, not privacy-policy-governed).';

-- The function was replaced, so its grants were reset to the Postgres default
-- of EXECUTE TO PUBLIC. Re-apply the explicit narrowing from
-- 20260820140000_integrity_hardening.sql.
revoke all on function check_rate_limit(text, int, int) from public;
grant execute on function check_rate_limit(text, int, int) to service_role;
