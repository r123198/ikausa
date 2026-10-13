-- my_events() also returns visibility and up to 4 recent photo paths for
-- album previews. Photo RLS still applies (security invoker), so previews
-- only include photos the caller is allowed to see.
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
    (select count(*)::int from public.photos p
      where p.event_id = e.id and p.user_id = (select auth.uid())),
    (select count(*)::int from public.photos p where p.event_id = e.id),
    array(
      select p.storage_path from public.photos p
      where p.event_id = e.id
      order by p.created_at desc
      limit 4
    )
  from public.events e
  order by e.ends_at desc;
$$;

revoke execute on function public.my_events() from public, anon, authenticated;
grant execute on function public.my_events() to authenticated;
