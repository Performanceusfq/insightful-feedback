insert into public.user_roles (user_id, role)
select
  p.id,
  p.active_role
from public.profiles p
on conflict (user_id, role) do nothing;
