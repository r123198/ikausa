-- Hosts can delete a roll. Storage can't be cleaned up from SQL, so the app
-- first removes every file under the roll's folder (the "Owners and authors
-- delete event files" policy allows it), then deletes the event row, which
-- cascades to members and photos. A spent pass credit stays spent.

-- Every file in a roll's folder, including guests' shots the host can't see
-- yet. Returns nothing unless the caller owns the roll.
create function public.event_storage_paths(eid uuid)
returns setof text
language sql
stable 
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'event-media'
    and public.try_uuid((storage.foldername(o.name))[1]) = eid
    and exists (
      select 1 from public.events e
      where e.id = eid and e.owner_id = (select auth.uid())
    );
$$;

revoke execute on function public.event_storage_paths(uuid) from public, anon, authenticated;
grant execute on function public.event_storage_paths(uuid) to authenticated;
