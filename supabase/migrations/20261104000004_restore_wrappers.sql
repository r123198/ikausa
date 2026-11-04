-- Repair for running 20261104000001_cohost_spots.sql after 20261104000002_private_functions.sql.
-- That order overwrites two wrappers with privileged functions and leaves the private
-- copies without the co-host rule. Safe to run in any state once the private schema exists,
-- and a no-op when the migrations ran in filename order.

-- The real implementations, with the co-host rule.
create or replace function private.join_event(code text)
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

create or replace function private.get_event_preview(code text)
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

-- The public wrappers. `create or replace` keeps their existing grants.
create or replace function public.join_event(code text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.join_event(code);
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
security invoker
set search_path = ''
as $$
  select * from private.get_event_preview(code);
$$;
