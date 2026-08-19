-- Instant Estimate — initial schema
--
-- Implements the product model from docs/PRODUCT_SPEC.md (Section 28):
--
--   Business → Services → Questions → Pricing Rules → Estimate → Lead
--
-- and the calculation contract from docs/PRICING_ENGINE_SPEC.md.
--
-- Architecture note: the browser widget never talks to Supabase directly.
-- All homeowner-facing reads/writes (fetching a business's active pricing
-- config, submitting an estimate, creating a lead) go through server-side
-- Next.js route handlers using the service role key, which is what actually
-- calls the pricing engine in src/lib/pricing. That keeps this schema's RLS
-- simple: every table below is owner-only. There are deliberately no `anon`
-- policies, which also satisfies Section 25 of the product spec (public
-- estimate interactions must not expose data beyond what's necessary, and
-- one contractor must never be able to reach another's leads).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  brand_color text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table businesses is 'A contractor account/business profile. is_active gates whether the public widget and shareable links serve anything.';
comment on column businesses.slug is 'Used in the embed snippet and shareable estimate URLs.';

create index businesses_owner_id_idx on businesses (owner_id);

create trigger businesses_set_updated_at
  before update on businesses
  for each row execute function set_updated_at();

alter table businesses enable row level security;

create policy "owner manages own business"
  on businesses for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- True when the current authenticated user owns the given business.
-- Centralizes the ownership check used by every RLS policy below so a
-- contractor can never read or write another contractor's data. Defined
-- after `businesses` because it's an SQL-language function, which Postgres
-- validates against the catalog at creation time.
create or replace function is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from businesses b
    where b.id = target_business_id
      and b.owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  key text not null,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, key)
);

comment on table services is 'A service category a business offers (e.g. toilet_repair). key is stable and used by AI classification and the pricing engine.';

create index services_business_id_idx on services (business_id);

create trigger services_set_updated_at
  before update on services
  for each row execute function set_updated_at();

alter table services enable row level security;

create policy "owner manages own services"
  on services for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- service_variants
-- ---------------------------------------------------------------------------

create table service_variants (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  key text not null,
  name text not null,
  pricing_mode text not null default 'ranged' check (pricing_mode in ('ranged', 'fixed')),
  starting_price_cents integer not null check (starting_price_cents >= 0),
  minimum_price_cents integer check (minimum_price_cents is null or minimum_price_cents >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, key)
);

comment on table service_variants is 'A priceable variant of a service (e.g. repair vs. replacement). Each variant has its own starting price per PRICING_ENGINE_SPEC.md Section 4 — a variant is a distinct base, not a modifier.';
comment on column service_variants.starting_price_cents is 'Contractor-entered "normal starting price". The pricing engine derives the base range from this with a fixed system default spread (PRICING_ENGINE_SPEC.md Section 4) unless pricing_mode is fixed.';
comment on column service_variants.minimum_price_cents is 'Floor applied to the low bound only (ranged) or the single price (fixed). Null means no floor.';

create index service_variants_service_id_idx on service_variants (service_id);

create trigger service_variants_set_updated_at
  before update on service_variants
  for each row execute function set_updated_at();

alter table service_variants enable row level security;

create policy "owner manages own service variants"
  on service_variants for all
  using (is_business_owner((select business_id from services where services.id = service_id)))
  with check (is_business_owner((select business_id from services where services.id = service_id)));

-- ---------------------------------------------------------------------------
-- questions
-- ---------------------------------------------------------------------------

create table questions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  key text not null,
  prompt text not null,
  question_type text not null check (question_type in ('boolean', 'single_select', 'text')),
  options jsonb,
  required_for_pricing boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, key)
);

comment on table questions is 'Dynamic questions asked for a service (PRODUCT_SPEC.md Section 11). required_for_pricing flags answers the pricing engine cannot proceed without (PRICING_ENGINE_SPEC.md Section 11.2).';
comment on column questions.options is 'For question_type = single_select: array of {value, label}.';

create index questions_service_id_idx on questions (service_id);

create trigger questions_set_updated_at
  before update on questions
  for each row execute function set_updated_at();

alter table questions enable row level security;

create policy "owner manages own questions"
  on questions for all
  using (is_business_owner((select business_id from services where services.id = service_id)))
  with check (is_business_owner((select business_id from services where services.id = service_id)));

-- ---------------------------------------------------------------------------
-- pricing_modifiers
-- ---------------------------------------------------------------------------

create table pricing_modifiers (
  id uuid primary key default gen_random_uuid(),
  service_variant_id uuid not null references service_variants (id) on delete cascade,
  key text not null,
  name text not null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  condition_question_key text not null,
  condition_equals text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_variant_id, key)
);

comment on table pricing_modifiers is 'Flat-dollar surcharges (urgency, after-hours, weekend, ...). Applies when answers[condition_question_key] stringifies to condition_equals. PRICING_ENGINE_SPEC.md Section 5.';

create index pricing_modifiers_service_variant_id_idx on pricing_modifiers (service_variant_id);

create trigger pricing_modifiers_set_updated_at
  before update on pricing_modifiers
  for each row execute function set_updated_at();

alter table pricing_modifiers enable row level security;

create policy "owner manages own pricing modifiers"
  on pricing_modifiers for all
  using (is_business_owner((
    select s.business_id from service_variants sv
    join services s on s.id = sv.service_id
    where sv.id = service_variant_id
  )))
  with check (is_business_owner((
    select s.business_id from service_variants sv
    join services s on s.id = sv.service_id
    where sv.id = service_variant_id
  )));

-- ---------------------------------------------------------------------------
-- pricing_add_ons
-- ---------------------------------------------------------------------------

create table pricing_add_ons (
  id uuid primary key default gen_random_uuid(),
  service_variant_id uuid not null references service_variants (id) on delete cascade,
  key text not null,
  name text not null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_variant_id, key)
);

comment on table pricing_add_ons is 'Optional flat-dollar add-ons the homeowner may select. PRICING_ENGINE_SPEC.md Section 6.';

create index pricing_add_ons_service_variant_id_idx on pricing_add_ons (service_variant_id);

create trigger pricing_add_ons_set_updated_at
  before update on pricing_add_ons
  for each row execute function set_updated_at();

alter table pricing_add_ons enable row level security;

create policy "owner manages own pricing add-ons"
  on pricing_add_ons for all
  using (is_business_owner((
    select s.business_id from service_variants sv
    join services s on s.id = sv.service_id
    where sv.id = service_variant_id
  )))
  with check (is_business_owner((
    select s.business_id from service_variants sv
    join services s on s.id = sv.service_id
    where sv.id = service_variant_id
  )));

-- ---------------------------------------------------------------------------
-- pricing_quote_only_rules
-- ---------------------------------------------------------------------------

create table pricing_quote_only_rules (
  id uuid primary key default gen_random_uuid(),
  service_variant_id uuid not null references service_variants (id) on delete cascade,
  reason text not null,
  conditions jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table pricing_quote_only_rules is 'Escape hatch: when every {question_key, equals} in conditions matches the homeowner''s answers, the engine returns quote_required instead of a price. PRICING_ENGINE_SPEC.md Section 11.3.';

create index pricing_quote_only_rules_service_variant_id_idx on pricing_quote_only_rules (service_variant_id);

create trigger pricing_quote_only_rules_set_updated_at
  before update on pricing_quote_only_rules
  for each row execute function set_updated_at();

alter table pricing_quote_only_rules enable row level security;

create policy "owner manages own quote-only rules"
  on pricing_quote_only_rules for all
  using (is_business_owner((
    select s.business_id from service_variants sv
    join services s on s.id = sv.service_id
    where sv.id = service_variant_id
  )))
  with check (is_business_owner((
    select s.business_id from service_variants sv
    join services s on s.id = sv.service_id
    where sv.id = service_variant_id
  )));

-- ---------------------------------------------------------------------------
-- estimates
-- ---------------------------------------------------------------------------

create table estimates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  service_id uuid references services (id) on delete set null,
  service_variant_id uuid references service_variants (id) on delete set null,
  share_token uuid not null default gen_random_uuid(),
  homeowner_description text,
  answers jsonb not null default '{}'::jsonb,
  selected_add_on_keys jsonb not null default '[]'::jsonb,
  status text not null check (status in ('estimated', 'fixed', 'quote_required')),
  low_price_cents integer,
  high_price_cents integer,
  fixed_price_cents integer,
  breakdown jsonb,
  refusal_reason text,
  ai_classification jsonb,
  urgency text,
  service_address text,
  created_at timestamptz not null default now()
);

comment on table estimates is 'One calculate() call''s input + output (PRICING_ENGINE_SPEC.md Section 3). Written server-side only — the widget never inserts directly. share_token backs the shareable-estimate entry point (PRODUCT_SPEC.md Section 20); it is looked up via a server route, never through a direct anon table policy.';
comment on column estimates.ai_classification is 'Interpretive AI output only (service/variant confidence, candidates). Never authoritative — PRODUCT_SPEC.md Section 24.';

create unique index estimates_share_token_idx on estimates (share_token);
create index estimates_business_id_idx on estimates (business_id);

alter table estimates enable row level security;

create policy "owner reads own estimates"
  on estimates for select
  using (is_business_owner(business_id));

-- No insert/update/delete policy: estimates are written exclusively by
-- server-side route handlers using the service role key, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- estimate_photos
-- ---------------------------------------------------------------------------

create table estimate_photos (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

comment on table estimate_photos is 'Up to 3 homeowner-uploaded photos per estimate (PRODUCT_SPEC.md Section 10). storage_path points into the estimate-photos storage bucket.';

create index estimate_photos_estimate_id_idx on estimate_photos (estimate_id);

create or replace function enforce_max_estimate_photos()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from estimate_photos where estimate_id = new.estimate_id) >= 3 then
    raise exception 'An estimate may have at most 3 photos';
  end if;
  return new;
end;
$$;

create trigger estimate_photos_max_three
  before insert on estimate_photos
  for each row execute function enforce_max_estimate_photos();

alter table estimate_photos enable row level security;

create policy "owner reads own estimate photos"
  on estimate_photos for select
  using (is_business_owner((select business_id from estimates where estimates.id = estimate_id)));

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  estimate_id uuid references estimates (id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  preferred_contact_method text,
  preferred_service_timing text,
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table leads is 'A qualified lead (PRODUCT_SPEC.md Section 17). Always linked back to the estimate that produced it, including quote_required estimates — a lead without an automated price is still a valid lead (Section 15).';

create index leads_business_id_idx on leads (business_id);
create index leads_estimate_id_idx on leads (estimate_id);

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

alter table leads enable row level security;

create policy "owner reads own leads"
  on leads for select
  using (is_business_owner(business_id));

create policy "owner updates own lead status"
  on leads for update
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- No insert policy: leads are written exclusively by server-side route
-- handlers using the service role key, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Storage: homeowner-uploaded estimate photos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('estimate-photos', 'estimate-photos', false)
on conflict (id) do nothing;

-- No storage.objects policies are added for the anon/authenticated roles.
-- Uploads happen server-side (service role, via a signed upload URL issued
-- by a route handler) and contractor dashboard reads happen server-side too
-- (service role, after the owner-only estimate_photos check above), per
-- PRODUCT_SPEC.md Section 25 ("restrict uploaded photos to authorized
-- contexts").
