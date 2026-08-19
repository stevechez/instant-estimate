-- SMS notifications (PRODUCT_SPEC.md Section 19) need somewhere to send to.
-- Unlike email, there's no existing source for this (the contractor's login
-- email is free via auth.users; a phone number isn't collected anywhere).
-- Nullable and optional: SMS is additive to the required email notification,
-- not a replacement, and a business with no phone number set just doesn't
-- get texted.

alter table businesses
  add column notification_phone text;

comment on column businesses.notification_phone is 'Contractor phone number for SMS lead notifications, in E.164 format (e.g. +15551234567). Null means SMS notifications are off for this business.';
