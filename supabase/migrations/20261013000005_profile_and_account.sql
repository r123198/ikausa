-- Profile photos and self-service account deletion.

------------------------------------------------------------------------------
-- Avatars: private bucket, {user_id}/{file}.jpg
------------------------------------------------------------------------------
alter table public.profiles add column avatar_path text;

alter table public.profiles add constraint profiles_avatar_path_folder check (
  avatar_path is null or avatar_path like id::text || '/%'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(objects.name))[1] = (select auth.uid())::text
  );

create policy "Users delete their own avatar files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(objects.name))[1] = (select auth.uid())::text
  );

-- Readable by anyone who can see the profile (yourself and co-members).
create policy "Avatars follow profile visibility"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and exists (select 1 from public.profiles p where p.avatar_path = objects.name)
  );

-- Only the name and photo are editable; id and created_at stay fixed.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;

------------------------------------------------------------------------------
-- Account deletion
------------------------------------------------------------------------------

-- Event owners may remove any file in their event's folder (covers, guests'
-- photos), and authors their own photo files. Used by account deletion.
create policy "Owners and authors delete event files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-media'
    and (
      exists (
        select 1 from public.events e
        where e.id = public.try_uuid((storage.foldername(objects.name))[1])
          and e.owner_id = (select auth.uid())
      )
      or (storage.foldername(objects.name))[3] = (select auth.uid())::text
    )
  );

-- Every storage file that disappears with the caller's account: their avatar,
-- their own shots everywhere, and everything in rolls they own.
create function public.my_storage_paths()
returns table (bucket text, path text)
language sql
stable
security definer
set search_path = ''
as $$
  select 'avatars', o.name
  from storage.objects o
  where o.bucket_id = 'avatars'
    and (storage.foldername(o.name))[1] = (select auth.uid())::text
  union
  select 'event-media', o.name
  from storage.objects o
  where o.bucket_id = 'event-media'
    and (
      (storage.foldername(o.name))[3] = (select auth.uid())::text
      or exists (
        select 1 from public.events e
        where e.id = public.try_uuid((storage.foldername(o.name))[1])
          and e.owner_id = (select auth.uid())
      )
    );
$$;

-- Deleting the auth user cascades to the profile, owned rolls, memberships,
-- photos and credits. Call after removing the files from my_storage_paths().
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.my_storage_paths(), public.delete_my_account()
from public, anon, authenticated;
grant execute on function public.my_storage_paths() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
