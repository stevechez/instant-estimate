-- save_service_pricing: the atomic write boundary for the pricing setup
-- wizard's "Save pricing" action.
--
-- Root cause this fixes: the Supabase JS client only speaks PostgREST, and
-- each .from(...).insert()/.update()/.delete() call is its own independent
-- HTTP request / implicit transaction. A Server Action doing several such
-- calls in a loop (one per variant) has no way to make "Save" atomic — a
-- failure partway through leaves whatever ran before it committed, with no
-- rollback. There is no BEGIN/COMMIT available across multiple PostgREST
-- calls.
--
-- The fix: do all the writes for one Save inside a single Postgres
-- function, invoked with a single supabase.rpc() call. A function body runs
-- inside the transaction of the statement that calls it — if anything
-- inside raises, everything the function did (for every variant in the
-- payload, not just the one that failed) rolls back automatically. No
-- explicit BEGIN/COMMIT needed; the function call itself is the boundary.
--
-- security invoker (not definer): runs as the calling `authenticated` role,
-- so the existing RLS policies on service_variants/pricing_modifiers/
-- pricing_add_ons keep doing the ownership enforcement, same as if these
-- were separate PostgREST calls. No parallel authorization logic here.

create or replace function save_service_pricing(p_service_id uuid, p_variants jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_variant jsonb;
  v_variant_id uuid;
  v_modifier jsonb;
  v_addon jsonb;
  v_addon_name text;
  v_base_key text;
  v_key text;
  v_suffix integer;
  v_updated_rows integer;
begin
  for v_variant in select * from jsonb_array_elements(p_variants)
  loop
    v_variant_id := (v_variant->>'variant_id')::uuid;

    update service_variants
    set
      starting_price_cents = coalesce((v_variant->>'starting_price_cents')::integer, 0),
      minimum_price_cents = (v_variant->>'minimum_price_cents')::integer,
      pricing_mode = coalesce(v_variant->>'pricing_mode', 'ranged'),
      is_active = coalesce((v_variant->>'starting_price_cents')::integer, 0) > 0
    where id = v_variant_id
      and service_id = p_service_id;

    get diagnostics v_updated_rows = row_count;
    if v_updated_rows = 0 then
      -- Either the variant doesn't exist, or it isn't visible to this role
      -- under RLS (i.e. it isn't this caller's). Either way: abort the
      -- whole save rather than silently skipping it.
      raise exception 'Variant % not found for service %', v_variant_id, p_service_id;
    end if;

    -- Universal modifiers: replace-all. The list is short (3 fixed
    -- dimensions) so diffing isn't worth the complexity.
    delete from pricing_modifiers where service_variant_id = v_variant_id;

    for v_modifier in select * from jsonb_array_elements(coalesce(v_variant->'modifiers', '[]'::jsonb))
    loop
      insert into pricing_modifiers (
        service_variant_id, key, name, amount_cents, condition_question_key, condition_equals
      ) values (
        v_variant_id,
        v_modifier->>'key',
        v_modifier->>'name',
        (v_modifier->>'amount_cents')::integer,
        v_modifier->>'condition_question_key',
        v_modifier->>'condition_equals'
      );
    end loop;

    -- Add-ons: same replace-all approach. Keys are generated here, not by
    -- the client, specifically so collisions (two names normalizing to the
    -- same slug) can be de-duplicated before they ever hit the unique
    -- constraint, instead of failing the insert after the old rows are
    -- already gone.
    delete from pricing_add_ons where service_variant_id = v_variant_id;

    for v_addon in select * from jsonb_array_elements(coalesce(v_variant->'add_ons', '[]'::jsonb))
    loop
      v_addon_name := trim(v_addon->>'name');
      v_base_key := trim(both '_' from regexp_replace(lower(v_addon_name), '[^a-z0-9]+', '_', 'g'));
      if v_base_key = '' then
        v_base_key := 'addon';
      end if;

      v_key := v_base_key;
      v_suffix := 2;
      while exists (
        select 1 from pricing_add_ons
        where service_variant_id = v_variant_id and key = v_key
      ) loop
        v_key := v_base_key || '_' || v_suffix;
        v_suffix := v_suffix + 1;
      end loop;

      insert into pricing_add_ons (service_variant_id, key, name, amount_cents)
      values (v_variant_id, v_key, v_addon_name, (v_addon->>'amount_cents')::integer);
    end loop;
  end loop;
end;
$$;

comment on function save_service_pricing is 'Atomic write boundary for the pricing setup wizard: one RPC call replaces what used to be ~5 independent PostgREST calls per variant. security invoker so RLS still enforces ownership.';

-- Functions aren't auto-exposed to the Data API roles either (same lesson as
-- 20260819140000_grants.sql) — without this, calling it via supabase.rpc()
-- fails with "permission denied for function save_service_pricing".
grant execute on function save_service_pricing(uuid, jsonb) to authenticated;
