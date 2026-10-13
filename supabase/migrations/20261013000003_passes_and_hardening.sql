-- Paid passes (RevenueCat credits), reserve-then-upload photos, a real export
-- window, and a cap on failed join attempts.

------------------------------------------------------------------------------
-- Passes: what a roll is allowed to be. Paid passes need a purchased credit.
------------------------------------------------------------------------------
create table public.passes (
  id text primary key,
  name text not null,
  max_participants int check (max_participants > 0),         -- null = unlimited
  max_shots_per_person int check (max_shots_per_person > 0), -- null = unlimited
  revenuecat_product_id text unique,                         -- null = free
  display_price text,                                        -- fallback label; stores show localized prices
  sort int not null
);

insert into public.passes (id, name, max_participants, max_shots_per_person, revenuecat_product_id, display_price, sort)
values
  ('free', 'Free', 5, 36, null, null, 0),
  ('party', 'Party', 25, null, 'ikausa_pass_party', '₱309.99', 1),
  ('big_day', 'Big Day', 100, null, 'ikausa_pass_big_day', '₱1,859.99', 2),
  ('unlimited', 'Unlimited', null, null, 'ikausa_pass_unlimited', '₱6,199.99', 3);

alter table public.passes enable row level security;

create policy "Anyone can read the pass catalog"
  on public.passes for select to anon, authenticated
  using (true);

alter table public.events
  add column pass_id text not null default 'free' references public.passes (id),
  add column purged_at timestamptz;

-- One row per store purchase. Written only by the RevenueCat webhook (service role).
create table public.pass_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pass_id text not null references public.passes (id),
  store_transaction_id text not null unique,
  -- Deferred so a credit can be spent inside the event's own BEFORE INSERT trigger.
  event_id uuid references public.events (id) on delete set null deferrable initially deferred,
  created_at timestamptz not null default now(),
  spent_at timestamptz,
  revoked_at timestamptz
);

create index pass_credits_unspent_idx on public.pass_credits (user_id, pass_id)
  where spent_at is null and revoked_at is null;

alter table public.pass_credits enable row level security;

create policy "Users can see their own credits"
  on public.pass_credits for select to authenticated
  using (user_id = (select auth.uid()));

-- Enforce the pass's limits and spend a credit for paid passes.
create function public.enforce_pass()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pass public.passes;
  credit_id uuid;
begin
  select * into pass from public.passes where id = new.pass_id;
  if not found then
    raise exception 'unknown_pass';
  end if;

  if pass.max_participants is not null
     and (new.max_participants is null or new.max_participants > pass.max_participants) then
    raise exception 'pass_limit_participants';
  end if;

  if pass.max_shots_per_person is not null
     and (new.shots_per_person is null or new.shots_per_person > pass.max_shots_per_person) then
    raise exception 'pass_limit_shots';
  end if;

  if pass.revenuecat_product_id is not null then
    select id into credit_id
    from public.pass_credits
    where user_id = (select auth.uid())
      and pass_id = new.pass_id
      and spent_at is null
      and revoked_at is null
    order by created_at
    limit 1
    for update skip locked;

    if credit_id is null then
      raise exception 'pass_required';
    end if;

    update public.pass_credits
    set spent_at = now(), event_id = new.id
    where id = credit_id;
  end if;

  return new;
end;
$$;

create trigger events_enforce_pass
  before insert on public.events
  for each row execute function public.enforce_pass();

------------------------------------------------------------------------------
-- Photos: reserve a row first, upload the file, then mark it ready.
------------------------------------------------------------------------------
alter table public.photos
  add column status text not null default 'ready' check (status in ('pending', 'ready'));
alter table public.photos alter column status set default 'pending';

create index photos_pending_idx on public.photos (created_at) where status = 'pending';

-- New rows always start pending (clients can't claim an upload that never happened).
create or replace function public.enforce_shot_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  shot_limit int;
begin
  new.status := 'pending';

  select shots_per_person into shot_limit
  from public.events where id = new.event_id
  for update;

  if shot_limit is not null and (
    select count(*) from public.photos
    where event_id = new.event_id and user_id = new.user_id
  ) >= shot_limit then
    raise exception 'shot_limit_reached';
  end if;
  return new;
end;
$$;

drop policy "Photos are visible to their author, and to members once revealed" on public.photos;

-- Nothing is visible once the export window closes. Before that: authors see
-- their own shots, members see finished uploads once revealed.
create policy "Photos are visible to their author, and to members once revealed"
  on public.photos for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id and now() < e.export_until
    )
    and (
      user_id = (select auth.uid())
      or (
        status = 'ready'
        and exists (
          select 1 from public.events e
          where e.id = photos.event_id
            and public.is_event_member(e.id)
            and now() >= e.reveal_at
            and (e.everyone_can_see or e.owner_id = (select auth.uid()))
        )
      )
    )
  );

create policy "Authors can cancel their own unfinished uploads"
  on public.photos for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

create function public.mark_photo_ready(photo_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.photos p
  set status = 'ready'
  where p.id = photo_id
    and p.user_id = (select auth.uid())
    and p.status = 'pending'
    and exists (
      select 1 from storage.objects o
      where o.bucket_id = 'event-media' and o.name = p.storage_path
    );
  if not found then
    raise exception 'photo_not_uploaded';
  end if;
end;
$$;

drop policy "Members upload their own photos while they have shots" on storage.objects;

-- A photo file can only be uploaded to a path the user has reserved.
create policy "Members upload files for their reserved shots"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-media'
    and (storage.foldername(objects.name))[2] = 'photos'
    and (storage.foldername(objects.name))[3] = (select auth.uid())::text
    and exists (
      select 1 from public.photos p
      where p.storage_path = objects.name
        and p.user_id = (select auth.uid())
        and p.status = 'pending'
    )
  );

------------------------------------------------------------------------------
-- my_events: counts and previews only include finished uploads.
------------------------------------------------------------------------------
drop function public.my_events();

create function public.my_events()
returns table (
  id uuid,
  owner_id uuid,
  name text,
  invite_code text,
  ends_at timestamptz,
  reveal_at timestamptz,
  export_until timestamptz,
  max_participants int,
  shots_per_person int,
  camera_id text,
  cover text,
  created_at timestamptz,
  everyone_can_see boolean,
  member_count int,
  my_shot_count int,
  photo_count int,
  preview_paths text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.id, e.owner_id, e.name, e.invite_code, e.ends_at, e.reveal_at, e.export_until,
    e.max_participants, e.shots_per_person, e.camera_id, e.cover, e.created_at,
    e.everyone_can_see,
    (select count(*)::int from public.event_members m where m.event_id = e.id),
    -- Reserved (pending) shots count against the user's limit.
    (select count(*)::int from public.photos p
      where p.event_id = e.id and p.user_id = (select auth.uid())),
    (select count(*)::int from public.photos p
      where p.event_id = e.id and p.status = 'ready'),
    array(
      select p.storage_path from public.photos p
      where p.event_id = e.id and p.status = 'ready'
      order by p.created_at desc
      limit 4
    )
  from public.events e
  order by e.ends_at desc;
$$;

------------------------------------------------------------------------------
-- join_event: at most 20 failed codes per user per hour.
------------------------------------------------------------------------------
create table public.join_attempts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index join_attempts_user_idx on public.join_attempts (user_id, attempted_at);

alter table public.join_attempts enable row level security;
-- No policies: only join_event (security definer) reads and writes it.

-- Returns null for an unknown code (instead of raising) so the failed attempt
-- is recorded rather than rolled back.
create or replace function public.join_event(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  member_total int;
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.join_attempts
  where user_id = uid and attempted_at < now() - interval '1 day';

  if (
    select count(*) from public.join_attempts
    where user_id = uid and attempted_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'too_many_attempts';
  end if;

  -- Lock the event row so two people can't take the last spot at once.
  select * into e from public.events where invite_code = upper(trim(code)) for update;
  if not found then
    insert into public.join_attempts (user_id) values (uid);
    return null;
  end if;

  if exists (select 1 from public.event_members where event_id = e.id and user_id = uid) then
    return e.id;
  end if;

  if now() >= e.ends_at then
    raise exception 'event_ended';
  end if;

  select count(*) into member_total from public.event_members where event_id = e.id;
  if e.max_participants is not null and member_total >= e.max_participants then
    raise exception 'event_full';
  end if;

  insert into public.event_members (event_id, user_id) values (e.id, uid);
  return e.id;
end;
$$;

------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------
revoke execute on function
  public.enforce_pass(),
  public.mark_photo_ready(uuid),
  public.my_events(),
  public.join_event(text)
from public, anon, authenticated;

grant execute on function public.mark_photo_ready(uuid) to authenticated;
grant execute on function public.my_events() to authenticated;
grant execute on function public.join_event(text) to authenticated;
