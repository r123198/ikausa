-- Performance advisor: index every foreign key and give join_attempts a primary key.
-- The four indexes it reports as unused stay: their tables are still too small for
-- Postgres to use them, and join_event(), apply_shot_pack(), host links and
-- account deletion all need them as the data grows.

-- Account deletion clears these through ON DELETE CASCADE or SET NULL.
create index photos_user_id_idx on public.photos (user_id);
create index pass_credits_granted_by_idx on public.pass_credits (granted_by);
create index host_invites_used_by_idx on public.host_invites (used_by);
create index organizer_invites_created_by_idx on public.organizer_invites (created_by);
create index organizer_invites_used_by_idx on public.organizer_invites (used_by);

-- Deleting a roll sets this to null.
create index pass_credits_event_id_idx on public.pass_credits (event_id);

-- Catalog references. Passes and packs are rarely deleted, so these only guard that case.
create index events_pass_id_idx on public.events (pass_id);
create index pass_credits_pass_id_idx on public.pass_credits (pass_id);
create index shot_pack_credits_pack_id_idx on public.shot_pack_credits (pack_id);

-- join_event() only ever names user_id on insert, so it needs no change.
alter table public.join_attempts
  add column id bigint generated always as identity primary key;
