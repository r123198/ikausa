-- Pricing by participants, the same on web and mobile.
--   * Every plan allows up to 25 shots per person.
--   * Unlimited shots is an add-on: +₱699 on any plan, including Free.
--   * Participants are everyone on the roll except co-hosts, so the organizer counts
--     (the owner is an event member), as join_event already does.
-- Each tier × shots combination stays one pass row, so enforce_pass and the credit
-- system work unchanged. Sort is price order: the app picks the first pass that
-- covers what the host chose.
-- Old passes are hidden, not deleted: events and credits still point at them.
-- Run after 20261115000000_gcash_payments.sql.

alter table public.passes
  add column is_active boolean not null default true;

update public.passes
set is_active = false, gcash_price = null, sort = sort + 100
where id in ('party', 'party_36', 'big_day', 'big_day_36', 'unlimited', 'unlimited_36');

update public.passes set max_shots_per_person = 25 where id = 'free';

insert into public.passes
  (id, name, max_participants, max_shots_per_person, revenuecat_product_id, display_price, gcash_price, sort)
values
  ('free_unlimited', 'Free + unlimited shots', 5, null, 'ikausa_pass_5_unlimited', '₱699', 699, 3),
  ('p10', '10 participants', 10, 25, 'ikausa_pass_10', '₱119', 119, 1),
  ('p25', '25 participants', 25, 25, 'ikausa_pass_25', '₱309', 309, 2),
  ('p10_unlimited', '10 participants + unlimited shots', 10, null, 'ikausa_pass_10_unlimited', '₱818', 818, 4),
  ('p50', '50 participants', 50, 25, 'ikausa_pass_50', '₱949', 949, 5),
  ('p25_unlimited', '25 participants + unlimited shots', 25, null, 'ikausa_pass_25_unlimited', '₱1,008', 1008, 6),
  ('p50_unlimited', '50 participants + unlimited shots', 50, null, 'ikausa_pass_50_unlimited', '₱1,648', 1648, 7),
  ('p100', '100 participants', 100, 25, 'ikausa_pass_100', '₱1,899', 1899, 8),
  ('p100_unlimited', '100 participants + unlimited shots', 100, null, 'ikausa_pass_100_unlimited', '₱2,598', 2598, 9),
  ('p150', '150 participants', 150, 25, 'ikausa_pass_150', '₱3,179', 3179, 10),
  ('p150_unlimited', '150 participants + unlimited shots', 150, null, 'ikausa_pass_150_unlimited', '₱3,878', 3878, 11),
  ('p200', '200 participants', 200, 25, 'ikausa_pass_200', '₱4,449', 4449, 12),
  ('p200_unlimited', '200 participants + unlimited shots', 200, null, 'ikausa_pass_200_unlimited', '₱5,148', 5148, 13);

-- A retired pass can still be spent by a host who holds a credit for it, but can't be
-- paid for any more.
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
