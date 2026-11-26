-- The demo roll runs for 2 months at a time. When it ends, purge-expired calls
-- rotate_demo_roll(): it hands the DEMO code to a fresh copy of the roll (same owner,
-- name, cover and settings) and returns the ended demo rolls, whose photo files the
-- function then removes before deleting the rolls (members and photos cascade).
-- Replaces the 24-hour per-photo cleanup: photos now last as long as their demo.
-- Run after 20261126000000_demo_roll.sql.

-- Bring an existing open-ended demo roll down to 2 months.
update public.events
set ends_at = created_at + interval '2 months'
where is_demo and ends_at > created_at + interval '2 months';

create function public.rotate_demo_roll()
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  ended public.events;
begin
  select * into ended
  from public.events
  where is_demo and invite_code = 'DEMO' and ends_at <= now()
  for update;

  if found then
    -- Free the code first: invite codes are unique. Generated codes never contain O.
    update public.events set invite_code = public.generate_invite_code() where id = ended.id;

    insert into public.events
      (owner_id, name, invite_code, ends_at, reveal_option, export_days, max_participants,
       shots_per_person, everyone_can_see, camera_id, cover, pass_id, is_demo)
    values
      (ended.owner_id, ended.name, 'DEMO', now() + interval '2 months', ended.reveal_option,
       ended.export_days, ended.max_participants, ended.shots_per_person, ended.everyone_can_see,
       ended.camera_id, ended.cover, ended.pass_id, true);
  end if;

  -- Includes rolls left over from a run that failed before deleting them.
  return query select id from public.events where is_demo and ends_at <= now();
end;
$$;

revoke execute on function public.rotate_demo_roll() from public, anon, authenticated;
grant execute on function public.rotate_demo_roll() to service_role;
