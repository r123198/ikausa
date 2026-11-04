-- my_events() scanned every event in the database for each call, so it slowed down as
-- other people created rolls. It now starts from the caller's memberships.
-- only_id lets a single-roll screen skip computing the caller's other rolls. It defaults
-- to null, so released app builds that call my_events() with no arguments keep working.

drop function public.my_events();

create function public.my_events(only_id uuid default null)
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
  preview_paths text[],
  client_name text,
  pass_id text,
  my_role text
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
    (select count(*)::int from public.event_members m
      where m.event_id = e.id and m.role <> 'cohost'),
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
    ),
    e.client_name,
    e.pass_id,
    case
      when e.owner_id = (select auth.uid()) then 'owner'
      else coalesce((
        select m.role from public.event_members m
        where m.event_id = e.id and m.user_id = (select auth.uid())
      ), 'guest')
    end
  from public.events e
  -- Start from the caller's memberships. RLS alone would check every event in the
  -- database one by one. Owners are always members (add_owner_as_member trigger).
  where e.id in (
    select m.event_id from public.event_members m
    where m.user_id = (select auth.uid())
  )
    and (only_id is null or e.id = only_id)
  order by e.ends_at desc;
$$;

revoke execute on function public.my_events(uuid) from public, anon;
grant execute on function public.my_events(uuid) to authenticated, service_role;
