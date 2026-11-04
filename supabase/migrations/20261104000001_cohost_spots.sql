-- Co-hosts don't take a guest spot: they no longer count against the
-- participant cap or in the member counts shown next to it.
-- `create or replace` keeps each function's existing grants.

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

  select count(*) into member_total from public.event_members
  where event_id = e.id and role <> 'cohost';
  if e.max_participants is not null and member_total >= e.max_participants then
    raise exception 'event_full';
  end if;

  insert into public.event_members (event_id, user_id) values (e.id, uid);
  return e.id;
end;
$$;

create or replace function public.get_event_preview(code text)
returns table (
  name text,
  ends_at timestamptz,
  cover text,
  host_name text,
  member_count int,
  max_participants int,
  shots_per_person int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.name, e.ends_at, e.cover, p.display_name,
    (select count(*)::int from public.event_members m
      where m.event_id = e.id and m.role <> 'cohost'),
    e.max_participants, e.shots_per_person
  from public.events e
  join public.profiles p on p.id = e.owner_id
  where e.invite_code = upper(trim(code));
$$;

create or replace function public.my_events()
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
  order by e.ends_at desc;
$$;
