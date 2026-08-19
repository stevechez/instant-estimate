-- V1 assumes one business per contractor account (PRODUCT_SPEC.md doesn't
-- ask for multi-business support). Enforce it at the database level rather
-- than just in application code, so a double-submitted onboarding form
-- can't create two businesses for the same owner.

alter table businesses
  add constraint businesses_owner_id_key unique (owner_id);
