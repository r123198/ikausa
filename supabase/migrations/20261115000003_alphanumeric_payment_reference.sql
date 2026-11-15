-- Maya reference numbers may contain letters, so accept letters again (undoes the
-- digits-only rule from 20261115000002). References are stored uppercased with spaces
-- and dashes removed, so the same reference typed differently is still caught as a duplicate.
-- Every digits-only reference already stored passes the new check.

alter table public.payment_requests
  drop constraint payment_requests_reference_check,
  add constraint payment_requests_reference_check check (reference ~ '^[A-Z0-9]{6,30}$');

create or replace function private.submit_payment(pay_pass_id text, pay_reference text)
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

  select gcash_price into price from public.passes where id = pay_pass_id and is_active;
  if price is null then
    raise exception 'not_sold_on_web';
  end if;

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
