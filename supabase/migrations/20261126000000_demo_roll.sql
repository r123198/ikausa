-- The landing page "Try it" QR opens one shared demo roll (invite code DEMO).
--   * Anyone can join as a guest and take 15 Digicam shots.
--   * Photos are host-only (everyone_can_see = false): a guest sees just their own,
--     the admin account that owns the roll sees all of them.
--   * Each demo runs 2 months, then rotates (see *_demo_roll_rotation.sql).
-- The roll itself is created once by hand (see supabase/README.md, "Demo roll"),
-- because it has to be owned by your admin account.
-- Run after 20261115000004_guests_cannot_pay.sql.

alter table public.events
  add column is_demo boolean not null default false;

-- Free, hidden from the plan picker, no participant cap, 15 shots each.
insert into public.passes
  (id, name, max_participants, max_shots_per_person, revenuecat_product_id, display_price, gcash_price, is_active, sort)
values
  ('demo', 'Landing page demo', null, 15, null, null, null, false, 999)
on conflict (id) do nothing;
