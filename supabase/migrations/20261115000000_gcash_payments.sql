-- GCash / Maya payments for the web app, confirmed by hand.
--   1. The host pays the ikausa QR code, then submits the reference number from their receipt.
--   2. An admin checks the GCash history and confirms or rejects the request.
--   3. Confirming adds a pass_credits row, so the pass rules (enforce_pass) apply as for store purchases.
-- Same layout as 20261104000002_private_functions.sql: SECURITY DEFINER code lives in
-- `private`, and the API only sees SECURITY INVOKER wrappers.

------------------------------------------------------------------------------
-- Prices charged through GCash. Null means the pass can't be bought on the web yet.
------------------------------------------------------------------------------
alter table public.passes
  add column gcash_price numeric(10, 2) check (gcash_price > 0);

update public.passes set gcash_price = 309.99 where id = 'party';
update public.passes set gcash_price = 1859.99 where id = 'big_day';
update public.passes set gcash_price = 6199.99 where id = 'unlimited';

------------------------------------------------------------------------------
-- One row per payment a host reports.
------------------------------------------------------------------------------
create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pass_id text not null references public.passes (id),
  -- Copied from the pass when submitted, so a later price change doesn't alter it.
  amount numeric(10, 2) not null check (amount > 0),
  -- The reference number on the host's GCash or Maya receipt.
  reference text not null unique check (reference ~ '^[A-Z0-9]{6,30}$'),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  credit_id uuid references public.pass_credits (id) on delete set null
);

create index payment_requests_pending_idx on public.payment_requests (created_at)
  where status = 'pending';
create index payment_requests_user_idx on public.payment_requests (user_id, created_at desc);

alter table public.payment_requests enable row level security;

-- Reads only; every write goes through the functions below.
create policy "Users can see their own payments"
  on public.payment_requests for select to authenticated
  using (user_id = (select auth.uid()));

------------------------------------------------------------------------------
-- Host: report a payment
------------------------------------------------------------------------------
create function private.submit_payment(pay_pass_id text, pay_reference text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  ref text := upper(regexp_replace(coalesce(pay_reference, ''), '[\s-]', '', 'g'));
  price numeric(10, 2);
  new_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  if ref !~ '^[A-Z0-9]{6,30}$' then
    raise exception 'invalid_reference';
  end if;

  select gcash_price into price from public.passes where id = pay_pass_id;
  if price is null then
    raise exception 'not_sold_on_web';
  end if;

  -- Stops one account from flooding the admin queue.
  if (
    select count(*) from public.payment_requests where user_id = uid and status = 'pending'
  ) >= 3 then
    raise exception 'too_many_pending';
  end if;

  if exists (select 1 from public.payment_requests where reference = ref) then
    raise exception 'reference_used';
  end if;

  insert into public.payment_requests (user_id, pass_id, amount, reference)
  values (uid, pay_pass_id, price, ref)
  returning id into new_id;
  return new_id;
end;
$$;

------------------------------------------------------------------------------
-- Admin: the queue, and confirming or rejecting
------------------------------------------------------------------------------
create function private.admin_payment_requests()
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  email text,
  pass_id text,
  pass_name text,
  amount numeric,
  reference text,
  status text,
  created_at timestamptz,
  decided_at timestamptz
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
  -- Everything pending, plus the last two weeks of decisions for reference.
  return query
    select r.id, r.user_id, p.display_name, u.email::text, r.pass_id, ps.name, r.amount,
      r.reference, r.status, r.created_at, r.decided_at
    from public.payment_requests r
    join public.passes ps on ps.id = r.pass_id
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
    where r.status = 'pending' or r.decided_at > now() - interval '14 days'
    order by (r.status = 'pending') desc, coalesce(r.decided_at, r.created_at) desc
    limit 200;
end;
$$;

create function private.decide_payment(request_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.payment_requests;
  new_credit uuid;
begin
  if not private.is_admin() then
    raise exception 'not_admin';
  end if;

  -- Lock the row so two admins can't confirm the same payment twice.
  select * into r from public.payment_requests where id = request_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;
  if r.status <> 'pending' then
    raise exception 'payment_already_decided';
  end if;

  if approve then
    insert into public.pass_credits (user_id, pass_id, store_transaction_id, granted_by, note)
    values (r.user_id, r.pass_id, 'gcash:' || r.reference, (select auth.uid()),
      'GCash ' || r.reference)
    returning id into new_credit;
  end if;

  update public.payment_requests
  set status = case when approve then 'confirmed' else 'rejected' end,
    decided_at = now(),
    decided_by = (select auth.uid()),
    credit_id = new_credit
  where id = request_id;
end;
$$;

revoke all on function private.submit_payment(text, text) from public, anon;
revoke all on function private.admin_payment_requests() from public, anon;
revoke all on function private.decide_payment(uuid, boolean) from public, anon;
grant execute on function private.submit_payment(text, text) to authenticated;
grant execute on function private.admin_payment_requests() to authenticated;
grant execute on function private.decide_payment(uuid, boolean) to authenticated;

------------------------------------------------------------------------------
-- API wrappers
------------------------------------------------------------------------------
create function public.submit_payment(pay_pass_id text, pay_reference text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.submit_payment(pay_pass_id, pay_reference);
$$;

create function public.admin_payment_requests()
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  email text,
  pass_id text,
  pass_name text,
  amount numeric,
  reference text,
  status text,
  created_at timestamptz,
  decided_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.admin_payment_requests();
$$;

create function public.decide_payment(request_id uuid, approve boolean)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.decide_payment(request_id, approve);
$$;

revoke execute on function public.submit_payment(text, text) from public, anon;
revoke execute on function public.admin_payment_requests() from public, anon;
revoke execute on function public.decide_payment(uuid, boolean) from public, anon;
grant execute on function public.submit_payment(text, text) to authenticated;
grant execute on function public.admin_payment_requests() to authenticated;
grant execute on function public.decide_payment(uuid, boolean) to authenticated;
