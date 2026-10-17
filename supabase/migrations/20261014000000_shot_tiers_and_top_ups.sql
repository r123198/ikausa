-- Plans priced by guests and shots, and shot packs bought during a roll.

------------------------------------------------------------------------------
-- Plans: each pass is a guests × shots combination. The app picks the first
-- pass (by sort) that covers what the host chose, so keep sort in price order.
------------------------------------------------------------------------------
insert into public.passes (id, name, max_participants, max_shots_per_person, revenuecat_product_id, display_price, sort)
values
  ('party_36', 'Party', 25, 36, 'ikausa_pass_party_36', null, 1),
  ('big_day_36', 'Big Day', 100, 36, 'ikausa_pass_big_day_36', null, 3),
  ('unlimited_36', 'Unlimited', null, 36, 'ikausa_pass_unlimited_36', null, 5);

update public.passes set sort = 2 where id = 'party';
update public.passes set sort = 4 where id = 'big_day';
update public.passes set sort = 6 where id = 'unlimited';

------------------------------------------------------------------------------
-- Shot packs: extra shots for one member in one roll.
------------------------------------------------------------------------------
create table public.shot_packs (
  id text primary key,
  name text not null,
  shots int not null check (shots > 0),
  revenuecat_product_id text not null unique,
  display_price text,                                        -- fallback label; stores show localized prices
  sort int not null
);

insert into public.shot_packs (id, name, shots, revenuecat_product_id, display_price, sort)
values
  ('shots_10', '+10 shots', 10, 'ikausa_shots_10', null, 0),
  ('shots_24', '+24 shots', 24, 'ikausa_shots_24', null, 1);

alter table public.shot_packs enable row level security;

create policy "Anyone can read the shot pack catalog"
  on public.shot_packs for select to anon, authenticated
  using (true);

-- One row per store purchase. Written only by the RevenueCat webhook (service
-- role); spent by apply_shot_pack(), which ties it to a roll.
create table public.shot_pack_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pack_id text not null references public.shot_packs (id),
  store_transaction_id text not null unique,
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  spent_at timestamptz,
  revoked_at timestamptz
);

create index shot_pack_credits_unspent_idx on public.shot_pack_credits (user_id, pack_id)
  where spent_at is null and revoked_at is null;
create index shot_pack_credits_event_idx on public.shot_pack_credits (event_id, user_id)
  where event_id is not null;

alter table public.shot_pack_credits enable row level security;

create policy "Users can see their own shot packs"
  on public.shot_pack_credits for select to authenticated
  using (user_id = (select auth.uid()));

------------------------------------------------------------------------------
-- A member's shot limit: the roll's shots per person plus their applied packs.
-- Null when the roll is unlimited. A refunded pack stops counting.
------------------------------------------------------------------------------
create function public.shot_limit(eid uuid, uid uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select e.shots_per_person + coalesce((
    select sum(sp.shots)::int
    from public.shot_pack_credits c
    join public.shot_packs sp on sp.id = c.pack_id
    where c.event_id = e.id and c.user_id = uid and c.revoked_at is null
  ), 0)
  from public.events e
  where e.id = eid;
$$;

create or replace function public.can_add_photo(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    join public.event_members m on m.event_id = e.id and m.user_id = (select auth.uid())
    where e.id = eid
      and now() < e.ends_at
      and (
        e.shots_per_person is null
        or (
          select count(*) from public.photos p
          where p.event_id = e.id and p.user_id = (select auth.uid())
        ) < public.shot_limit(e.id, (select auth.uid()))
      )
  );
$$;

create or replace function public.enforce_shot_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_limit int;
begin
  new.status := 'pending';

  -- Serializes with other shots and with apply_shot_pack() for this roll.
  perform 1 from public.events where id = new.event_id for update;
  member_limit := public.shot_limit(new.event_id, new.user_id);

  if member_limit is not null and (
    select count(*) from public.photos
    where event_id = new.event_id and user_id = new.user_id
  ) >= member_limit then
    raise exception 'shot_limit_reached';
  end if;
  return new;
end;
$$;

-- Spend one of the caller's unspent packs on a roll they're shooting in.
create function public.apply_shot_pack(eid uuid, pack text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  e public.events;
  credit_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into e from public.events where id = eid for update;
  if not found or not exists (
    select 1 from public.event_members where event_id = eid and user_id = uid
  ) then
    raise exception 'event_not_found';
  end if;
  if now() >= e.ends_at then
    raise exception 'event_ended';
  end if;
  if e.shots_per_person is null then
    raise exception 'event_unlimited';
  end if;

  select id into credit_id
  from public.shot_pack_credits
  where user_id = uid
    and pack_id = pack
    and spent_at is null
    and revoked_at is null
  order by created_at
  limit 1
  for update skip locked;

  if credit_id is null then
    raise exception 'shot_pack_required';
  end if;

  update public.shot_pack_credits
  set spent_at = now(), event_id = eid
  where id = credit_id;
end;
$$;

------------------------------------------------------------------------------
-- my_events: also returns the caller's own shot limit (packs included).
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
  my_shot_limit int,
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
    -- RLS limits shot_pack_credits to the caller's own packs.
    e.shots_per_person + coalesce((
      select sum(sp.shots)::int
      from public.shot_pack_credits c
      join public.shot_packs sp on sp.id = c.pack_id
      where c.event_id = e.id and c.revoked_at is null
    ), 0),
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
-- Grants
------------------------------------------------------------------------------
revoke execute on function
  public.shot_limit(uuid, uuid),
  public.apply_shot_pack(uuid, text),
  public.my_events()
from public, anon, authenticated;

grant execute on function public.apply_shot_pack(uuid, text) to authenticated;
grant execute on function public.my_events() to authenticated;
