-- Ikausa initial schema: profiles, events (rolls), members, photos, storage.
-- Run once in the Supabase dashboard → SQL Editor, or with `supabase db push`.

------------------------------------------------------------------------------
-- Profiles
------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Policy is created further down, once event_members exists.

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Create a profile for every new auth user, using the name given at sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Member'),
      40
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------------
-- Events (a "roll")
------------------------------------------------------------------------------
create function public.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 8 chars (~40 bits) from a CSPRNG, no look-alike characters (0/O, 1/I).
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + get_byte(bytes, i) % 32, 1),
    ''
  )
  from (select uuid_send(gen_random_uuid()) as bytes) b, generate_series(0, 7) as i;
$$;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  invite_code text not null unique default public.generate_invite_code(),
  ends_at timestamptz not null,
  reveal_option text not null check (reveal_option in ('during', 'after', 'delay')),
  -- Derived by trigger: when photos become visible.
  reveal_at timestamptz not null,
  export_days int not null check (export_days in (7, 30, 90)),
  -- Derived by trigger: last moment photos can be exported.
  export_until timestamptz not null,
  max_participants int check (max_participants > 0),   -- null = unlimited
  shots_per_person int check (shots_per_person > 0),   -- null = unlimited
  everyone_can_see boolean not null default true,
  camera_id text not null,
  -- 'preset:<id>' for a bundled cover, otherwise a storage path in event-media.
  cover text,
  created_at timestamptz not null default now(),
  check (ends_at > created_at)
);

create index events_owner_id_idx on public.events (owner_id);

-- Reveal delay used for reveal_option = 'delay'.
create function public.set_event_derived_times()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  end if;
  new.reveal_at := case new.reveal_option
    when 'during' then new.created_at
    when 'after' then new.ends_at
    else new.ends_at + interval '24 hours'
  end;
  new.export_until := greatest(new.ends_at, new.reveal_at)
    + make_interval(days => new.export_days);
  return new;
end;
$$;

create trigger events_set_derived_times
  before insert or update of ends_at, reveal_option, export_days on public.events
  for each row execute function public.set_event_derived_times();

------------------------------------------------------------------------------
-- Members
------------------------------------------------------------------------------
create table public.event_members (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_members_user_id_idx on public.event_members (user_id);

create function public.is_event_member(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_members
    where event_id = eid and user_id = (select auth.uid())
  );
$$;

-- The creator is always a member of their own event.
create function public.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.event_members (event_id, user_id) values (new.id, new.owner_id);
  return new;
end;
$$;

create trigger events_add_owner_as_member
  after insert on public.events
  for each row execute function public.add_owner_as_member();

alter table public.events enable row level security;
alter table public.event_members enable row level security;

-- owner_id check lets `insert ... returning` see the row before the
-- add-owner-as-member trigger has run.
create policy "Members can read their events"
  on public.events for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_event_member(id));

create policy "Users can create events they own"
  on public.events for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can update their events"
  on public.events for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Timing, limits and visibility are fixed once the roll starts; otherwise an
-- owner could force an early reveal or lift the participant cap.
revoke update on public.events from anon, authenticated;
grant update (name, cover) on public.events to authenticated;

create policy "Owners can delete their events"
  on public.events for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "Members can see who else is in the event"
  on public.event_members for select to authenticated
  using (public.is_event_member(event_id));

create policy "Users can read their own and co-members' profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.event_members theirs
      join public.event_members mine on mine.event_id = theirs.event_id
      where theirs.user_id = profiles.id and mine.user_id = (select auth.uid())
    )
  );
-- No insert policy: joining goes through join_event() so limits are enforced.

------------------------------------------------------------------------------
-- Photos
------------------------------------------------------------------------------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index photos_event_id_idx on public.photos (event_id);

-- True when the current user may take another photo in this event:
-- they are a member, the event is still running and they have shots left.
create function public.can_add_photo(eid uuid)
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
        ) < e.shots_per_person
      )
  );
$$;

create function public.enforce_shot_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  shot_limit int;
begin
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

create trigger photos_enforce_shot_limit
  before insert on public.photos
  for each row execute function public.enforce_shot_limit();

alter table public.photos enable row level security;

create policy "Photos are visible to their author, and to members once revealed"
  on public.photos for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_event_member(e.id)
        and now() >= e.reveal_at
        and (e.everyone_can_see or e.owner_id = (select auth.uid()))
    )
  );

create policy "Members can add photos while the event runs"
  on public.photos for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and storage_path like event_id::text || '/photos/' || user_id::text || '/%'
    and public.can_add_photo(event_id)
  );

------------------------------------------------------------------------------
-- RPCs
------------------------------------------------------------------------------

-- Everything the app lists, with counts, for the signed-in user.
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
  member_count int,
  my_shot_count int,
  photo_count int
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.id, e.owner_id, e.name, e.invite_code, e.ends_at, e.reveal_at, e.export_until,
    e.max_participants, e.shots_per_person, e.camera_id, e.cover, e.created_at,
    (select count(*)::int from public.event_members m where m.event_id = e.id),
    (select count(*)::int from public.photos p
      where p.event_id = e.id and p.user_id = (select auth.uid())),
    (select count(*)::int from public.photos p where p.event_id = e.id)
  from public.events e
  order by e.ends_at desc;
$$;

-- Public preview shown on the join screen before someone joins.
create function public.get_event_preview(code text)
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
    (select count(*)::int from public.event_members m where m.event_id = e.id),
    e.max_participants, e.shots_per_person
  from public.events e
  join public.profiles p on p.id = e.owner_id
  where e.invite_code = upper(trim(code));
$$;

-- Join by invite code. Errors: event_not_found, event_ended, event_full.
create function public.join_event(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  member_total int;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;

  -- Lock the event row so two people can't take the last spot at once.
  select * into e from public.events where invite_code = upper(trim(code)) for update;
  if not found then
    raise exception 'event_not_found';
  end if;

  if exists (
    select 1 from public.event_members
    where event_id = e.id and user_id = (select auth.uid())
  ) then
    return e.id;
  end if;

  if now() >= e.ends_at then
    raise exception 'event_ended';
  end if;

  select count(*) into member_total from public.event_members where event_id = e.id;
  if e.max_participants is not null and member_total >= e.max_participants then
    raise exception 'event_full';
  end if;

  insert into public.event_members (event_id, user_id) values (e.id, (select auth.uid()));
  return e.id;
end;
$$;

-- Lock down function execution to the roles that need it.
revoke execute on function
  public.handle_new_user(),
  public.generate_invite_code(),
  public.set_event_derived_times(),
  public.add_owner_as_member(),
  public.is_event_member(uuid),
  public.can_add_photo(uuid),
  public.enforce_shot_limit(),
  public.my_events(),
  public.get_event_preview(text),
  public.join_event(text)
from public, anon, authenticated;

grant execute on function public.generate_invite_code() to authenticated;
grant execute on function public.is_event_member(uuid) to authenticated;
grant execute on function public.can_add_photo(uuid) to authenticated;
grant execute on function public.my_events() to authenticated;
grant execute on function public.join_event(text) to authenticated;
grant execute on function public.get_event_preview(text) to anon, authenticated;

------------------------------------------------------------------------------
-- Storage: one private bucket.
--   {event_id}/photos/{user_id}/{file}.jpg
--   {event_id}/cover/{file}.jpg
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-media', 'event-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

-- Safe uuid parse for path segments (bad paths simply fail the policy).
create function public.try_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;

grant execute on function public.try_uuid(text) to anon, authenticated;

create policy "Covers are readable by anyone with the link"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'event-media'
    and (storage.foldername(name))[2] = 'cover'
  );

create policy "Photo files follow photo visibility"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'event-media'
    and exists (select 1 from public.photos p where p.storage_path = objects.name)
  );

create policy "Members upload their own photos while they have shots"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-media'
    and (storage.foldername(name))[2] = 'photos'
    and (storage.foldername(name))[3] = (select auth.uid())::text
    and public.can_add_photo(public.try_uuid((storage.foldername(name))[1]))
  );

create policy "Owners upload their event cover"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-media'
    and (storage.foldername(name))[2] = 'cover'
    and exists (
      select 1 from public.events e
      where e.id = public.try_uuid((storage.foldername(objects.name))[1])
        and e.owner_id = (select auth.uid())
    )
  );
