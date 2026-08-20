-- Defense in depth to match the app-side checks in
-- lib/estimate-photos/validate.ts (MAX_PHOTO_BYTES, image/* only) — the
-- bucket itself now rejects anything the app validation should have already
-- caught, in case that check is ever bypassed or a future caller forgets it.

update storage.buckets
set
  file_size_limit = 8388608, -- 8MB, matches MAX_PHOTO_BYTES
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
where id = 'estimate-photos';
