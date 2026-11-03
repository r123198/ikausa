-- Studio: an invite-only web portal for organizers (event planners,
-- photographers) who run rolls for their clients.
--   * Admins invite organizers with one-time links.
--   * Admins grant pass credits by hand (paid outside the stores).
--   * Organizers hand a roll to their client through a one-time host link,
--     which makes the client a co-host: they see every photo like the owner.

------------------------------------------------------------------------------
-- Organizers and admins
------------------------------------------------------------------------------
-- No write policies: rows are only added by redeem_organizer_invite().
create table public.organizers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.organizers enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizers
    where user_id = (select auth.uid()) and is_admin
  );
$$;

create policy "Organizers see their own row, admins see all"
  on public.organizers for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- One-time links an admin sends to a new organizer.
create table public.organizer_invites (
  token text primary key default replace(gen_random_uuid()::text, '-', ''),
  note text check (char_length(note) <= 100),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz
);

alter table public.organizer_invites enable row level security;

create policy "Admins see organizer invites"
  on public.organizer_invites for select to authenticated
  using (public.is_admin());

create function public.create_organizer_invite(invite_note text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_token text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  insert into public.organizer_invites (note, created_by)
  values (nullif(trim(invite_note), ''), (select auth.uid()))
  returning token into new_token;
  return new_token;
end;
$$;

create function public.redeem_organizer_invite(invite_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  invite public.organizer_invites;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.organizers where user_id = uid) then
    return;
  end if;

  select * into invite from public.organizer_invites where token = invite_token for update;
  if not found or invite.used_at is not null or now() >= invite.expires_at then
    raise exception 'invite_invalid';
  end if;

  insert into public.organizers (user_id) values (uid);
  update public.organizer_invites set used_by = uid, used_at = now() where token = invite_token;
end;
$$;

------------------------------------------------------------------------------
-- Manually granted pass credits
------------------------------------------------------------------------------
alter table public.pass_credits
  add column granted_by uuid references public.profiles (id) on delete set null,
  add column note text check (char_length(note) <= 100);

-- Store purchases use the store's transaction id; manual grants get
-- 'manual:<uuid>' so the unique constraint and webhook revokes still hold.
create function public.grant_pass_credits(
  organizer_id uuid,
  grant_pass_id text,
  quantity int,
  grant_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select 1 from public.organizers where user_id = organizer_id) then
    raise exception 'not_an_organizer';
  end if;
  if not exists (
    select 1 from public.passes where id = grant_pass_id and revenuecat_product_id is not null
  ) then
    raise exception 'not_a_paid_pass';
  end if;
  if quantity not between 1 and 50 then
    raise exception 'invalid_quantity';
  end if;

  insert into public.pass_credits (user_id, pass_id, store_transaction_id, granted_by, note)
  select organizer_id, grant_pass_id, 'manual:' || gen_random_uuid(), (select auth.uid()),
    nullif(trim(grant_note), '')
  from generate_series(1, quantity);
end;
$$;

-- Organizers with their unused credits per pass, for the admin screen.
create function public.admin_organizers()
returns table (
  user_id uuid,
  display_name text,
  email text,
  created_at timestamptz,
  is_admin boolean,
  event_count int,
  unused_credits jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  return query
    select
      o.user_id, p.display_name, u.email::text, o.created_at, o.is_admin,
      (select count(*)::int from public.events e where e.owner_id = o.user_id),
      coalesce((
        select jsonb_object_agg(c.pass_id, c.total)
        from (
          select pc.pass_id, count(*) as total
          from public.pass_credits pc
          where pc.user_id = o.user_id and pc.spent_at is null and pc.revoked_at is null
          group by pc.pass_id
        ) c
      ), '{}'::jsonb)
    from public.organizers o
    join public.profiles p on p.id = o.user_id
    join auth.users u on u.id = o.user_id
    order by o.created_at desc;
end;
$$;

------------------------------------------------------------------------------
-- Clients: a name on the roll, and co-hosts
------------------------------------------------------------------------------
alter table public.events
  add column client_name text check (char_length(trim(client_name)) between 1 and 60);

grant update (client_name) on public.events to authenticated;

alter table public.event_members
  add column role text not null default 'guest' check (role in ('guest', 'cohost'));

-- Owner or co-host: sees every photo, like the owner, even on host-only rolls.
create function public.is_event_host(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = eid and e.owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.event_members m
    where m.event_id = eid and m.user_id = (select auth.uid()) and m.role = 'cohost'
  );
$$;

drop policy "Photos are visible to their author, and to members once revealed" on public.photos;

create policy "Photos are visible to their author, and to members once revealed"
  on public.photos for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id and now() < e.export_until
    )
    and (
      user_id = (select auth.uid())
      or (
        status = 'ready'
        and exists (
          select 1 from public.events e
          where e.id = photos.event_id
            and public.is_event_member(e.id)
            and now() >= e.reveal_at
            and (e.everyone_can_see or public.is_event_host(e.id))
        )
      )
    )
  );

-- One-time links an owner sends to their client to make them a co-host.
create table public.host_invites (
  token text primary key default replace(gen_random_uuid()::text, '-', ''),
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz
);

create index host_invites_event_id_idx on public.host_invites (event_id);

alter table public.host_invites enable row level security;

create policy "Owners see their rolls' host links"
  on public.host_invites for select to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = host_invites.event_id and e.owner_id = (select auth.uid())
  ));

create function public.create_host_invite(eid uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_token text;
begin
  if not exists (
    select 1 from public.events e
    where e.id = eid and e.owner_id = (select auth.uid()) and now() < e.export_until
  ) then
    raise exception 'not_owner';
  end if;
  insert into public.host_invites (event_id) values (eid) returning token into new_token;
  return new_token;
end;
$$;

-- Roll name for the host link page, shown before the client signs in.
create function public.host_invite_preview(invite_token text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select e.name
  from public.host_invites h
  join public.events e on e.id = h.event_id
  where h.token = invite_token and h.used_at is null and now() < e.export_until;
$$;

-- Co-hosts don't take a guest spot, so this skips the participant cap.
create function public.redeem_host_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  invite public.host_invites;
  e public.events;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into invite from public.host_invites where token = invite_token for update;
  if not found then
    raise exception 'invite_invalid';
  end if;
  select * into e from public.events where id = invite.event_id;

  -- The owner opening their own link (e.g. to test it) leaves it unused.
  if e.owner_id = uid then
    return e.id;
  end if;
  if invite.used_at is not null or now() >= e.export_until then
    raise exception 'invite_invalid';
  end if;

  insert into public.event_members (event_id, user_id, role)
  values (e.id, uid, 'cohost')
  on conflict (event_id, user_id) do update set role = 'cohost';
  update public.host_invites set used_by = uid, used_at = now() where token = invite_token;
  return e.id;
end;
$$;

------------------------------------------------------------------------------
-- my_events: also returns the client name and the caller's role.
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

------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------
revoke execute on function
  public.is_admin(),
  public.create_organizer_invite(text),
  public.redeem_organizer_invite(text),
  public.grant_pass_credits(uuid, text, int, text),
  public.admin_organizers(),
  public.is_event_host(uuid),
  public.create_host_invite(uuid),
  public.host_invite_preview(text),
  public.redeem_host_invite(text),
  public.my_events()
from public, anon, authenticated;

grant execute on function
  public.is_admin(),
  public.create_organizer_invite(text),
  public.redeem_organizer_invite(text),
  public.grant_pass_credits(uuid, text, int, text),
  public.admin_organizers(),
  public.is_event_host(uuid),
  public.create_host_invite(uuid),
  public.redeem_host_invite(text),
  public.my_events()
to authenticated;

grant execute on function public.host_invite_preview(text) to anon, authenticated;
