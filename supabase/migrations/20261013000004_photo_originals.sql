-- Film looks: the developed photo lives at storage_path, the untouched original
-- (when a look was applied) at original_path. Both follow the same rules.
alter table public.photos add column original_path text unique;

drop policy "Members upload files for their reserved shots" on storage.objects;

create policy "Members upload files for their reserved shots"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-media'
    and (storage.foldername(objects.name))[2] = 'photos'
    and (storage.foldername(objects.name))[3] = (select auth.uid())::text
    and exists (
      select 1 from public.photos p
      where (p.storage_path = objects.name or p.original_path = objects.name)
        and p.user_id = (select auth.uid())
        and p.status = 'pending'
    )
  );

drop policy "Photo files follow photo visibility" on storage.objects;

create policy "Photo files follow photo visibility"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'event-media'
    and exists (
      select 1 from public.photos p
      where p.storage_path = objects.name or p.original_path = objects.name
    )
  );

-- An original must sit next to its developed photo in the same user folder.
alter table public.photos add constraint photos_original_path_folder check (
  original_path is null
  or original_path like event_id::text || '/photos/' || user_id::text || '/%'
);
