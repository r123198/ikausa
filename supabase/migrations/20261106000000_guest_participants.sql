-- Guests join a roll from an invite link with just a name (Supabase anonymous sign-ins).
-- They get the `authenticated` role with `is_anonymous: true` in their token, so joining,
-- shooting, uploading and buying shot packs already work through the existing rules.
-- These rules keep the rest account-only: starting a roll, co-hosting, organizing.
--
-- Also turn on Authentication → Sign In / Providers → "Allow anonymous sign-ins".

create or replace function private.is_guest()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

revoke execute on function private.is_guest() from public, anon;
grant execute on function private.is_guest() to authenticated, service_role;

-- Restrictive: applies on top of "Users can create events they own".
create policy "Guests can't start rolls"
  on public.events
  as restrictive
  for insert
  to authenticated
  with check (not private.is_guest());

create or replace function public.redeem_host_invite(invite_token text)
returns uuid
language plpgsql
set search_path = ''
as $$
begin
  if private.is_guest() then
    raise exception 'account_required';
  end if;
  return private.redeem_host_invite(invite_token);
end;
$$;

create or replace function public.redeem_organizer_invite(invite_token text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if private.is_guest() then
    raise exception 'account_required';
  end if;
  perform private.redeem_organizer_invite(invite_token);
end;
$$;
