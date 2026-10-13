-- Create profiles for accounts that signed up before the on_auth_user_created
-- trigger existed. Safe to run more than once.
insert into public.profiles (id, display_name)
select
  u.id,
  left(coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), 'Member'), 40)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
