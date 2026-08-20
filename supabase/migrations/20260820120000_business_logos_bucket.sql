-- Business logos (PRODUCT_SPEC.md Section 22). Unlike estimate-photos, this
-- bucket is PUBLIC: logos render on the anonymous homeowner-facing widget
-- (app/e/[slug]), so they need to be viewable without a signed URL. A
-- business's own logo is not sensitive information.
--
-- Uploads still go through the service role only, same as estimate-photos —
-- no anon/authenticated storage.objects policies are added. The contractor
-- dashboard settings action authorizes the write (owner-only, via RLS on
-- businesses) before ever touching storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-logos', 'business-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
