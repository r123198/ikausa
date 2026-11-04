-- Security advisor: no SECURITY DEFINER function stays directly callable through the API.
--   * Helpers used only by access policies move to `private`, out of the API.
--     Policies follow the move on their own.
--   * Functions the app calls move to `private` too. A SECURITY INVOKER wrapper with
--     the same name and arguments keeps /rest/v1/rpc/<name> working for every app build.
-- Each function still does its own auth checks; existing grants move with it.
-- Run after 20261104000001_cohost_spots.sql.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

------------------------------------------------------------------------------
-- Policy helpers: no longer callable through the API
------------------------------------------------------------------------------
alter function public.is_admin() set schema private;
alter function public.is_event_member(uuid) set schema private;
alter function public.is_event_host(uuid) set schema private;
alter function public.can_add_photo(uuid) set schema private;

------------------------------------------------------------------------------
-- Functions the app calls: implementation in private, wrapper in public
------------------------------------------------------------------------------
alter function public.admin_organizers() set schema private;
alter function public.apply_shot_pack(uuid, text) set schema private;
alter function public.create_host_invite(uuid) set schema private;
alter function public.create_organizer_invite(text) set schema private;
alter function public.delete_my_account() set schema private;
alter function public.event_storage_paths(uuid) set schema private;
alter function public.get_event_preview(text) set schema private;
alter function public.grant_pass_credits(uuid, text, int, text) set schema private;
alter function public.host_invite_preview(text) set schema private;
alter function public.join_event(text) set schema private;
alter function public.mark_photo_ready(uuid) set schema private;
alter function public.my_storage_paths() set schema private;
alter function public.redeem_host_invite(text) set schema private;
alter function public.redeem_organizer_invite(text) set schema private;

-- These three call is_admin() by name, so their bodies follow its move.
create or replace function private.create_organizer_invite(invite_note text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_token text;
begin
  if not private.is_admin() then
    raise exception 'not_admin';
  end if;
  insert into public.organizer_invites (note, created_by)
  values (nullif(trim(invite_note), ''), (select auth.uid()))
  returning token into new_token;
  return new_token;
end;
$$;

create or replace function private.grant_pass_credits(
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
  if not private.is_admin() then
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

create or replace function private.admin_organizers()
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
  if not private.is_admin() then
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
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.admin_organizers();
$$;

revoke execute on function public.admin_organizers() from public, anon, authenticated;
grant execute on function public.admin_organizers() to authenticated, service_role;

create function public.apply_shot_pack(eid uuid, pack text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.apply_shot_pack(eid, pack);
$$;

revoke execute on function public.apply_shot_pack(uuid, text) from public, anon, authenticated;
grant execute on function public.apply_shot_pack(uuid, text) to authenticated, service_role;

create function public.create_host_invite(eid uuid)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.create_host_invite(eid);
$$;

revoke execute on function public.create_host_invite(uuid) from public, anon, authenticated;
grant execute on function public.create_host_invite(uuid) to authenticated, service_role;

create function public.create_organizer_invite(invite_note text)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.create_organizer_invite(invite_note);
$$;

revoke execute on function public.create_organizer_invite(text) from public, anon, authenticated;
grant execute on function public.create_organizer_invite(text) to authenticated, service_role;

create function public.delete_my_account()
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.delete_my_account();
$$;

revoke execute on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated, service_role;

create function public.event_storage_paths(eid uuid)
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.event_storage_paths(eid);
$$;

revoke execute on function public.event_storage_paths(uuid) from public, anon, authenticated;
grant execute on function public.event_storage_paths(uuid) to authenticated, service_role;

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
security invoker
set search_path = ''
as $$
  select * from private.get_event_preview(code);
$$;

revoke execute on function public.get_event_preview(text) from public, anon, authenticated;
grant execute on function public.get_event_preview(text) to anon, authenticated, service_role;

create function public.grant_pass_credits(organizer_id uuid, grant_pass_id text, quantity int, grant_note text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.grant_pass_credits(organizer_id, grant_pass_id, quantity, grant_note);
$$;

revoke execute on function public.grant_pass_credits(uuid, text, int, text) from public, anon, authenticated;
grant execute on function public.grant_pass_credits(uuid, text, int, text) to authenticated, service_role;

create function public.host_invite_preview(invite_token text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select private.host_invite_preview(invite_token);
$$;

revoke execute on function public.host_invite_preview(text) from public, anon, authenticated;
grant execute on function public.host_invite_preview(text) to anon, authenticated, service_role;

create function public.join_event(code text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.join_event(code);
$$;

revoke execute on function public.join_event(text) from public, anon, authenticated;
grant execute on function public.join_event(text) to authenticated, service_role;

create function public.mark_photo_ready(photo_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.mark_photo_ready(photo_id);
$$;

revoke execute on function public.mark_photo_ready(uuid) from public, anon, authenticated;
grant execute on function public.mark_photo_ready(uuid) to authenticated, service_role;

create function public.my_storage_paths()
returns table (bucket text, path text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.my_storage_paths();
$$;

revoke execute on function public.my_storage_paths() from public, anon, authenticated;
grant execute on function public.my_storage_paths() to authenticated, service_role;

create function public.redeem_host_invite(invite_token text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.redeem_host_invite(invite_token);
$$;

revoke execute on function public.redeem_host_invite(text) from public, anon, authenticated;
grant execute on function public.redeem_host_invite(text) to authenticated, service_role;

create function public.redeem_organizer_invite(invite_token text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.redeem_organizer_invite(invite_token);
$$;

revoke execute on function public.redeem_organizer_invite(text) from public, anon, authenticated;
grant execute on function public.redeem_organizer_invite(text) to authenticated, service_role;

------------------------------------------------------------------------------
-- join_attempts is only touched by join_event(): make "no direct access" explicit
------------------------------------------------------------------------------
create policy "No direct access to join attempts"
  on public.join_attempts for all to anon, authenticated
  using (false)
  with check (false);
