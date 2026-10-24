-- Staff logins of a gym (owner's staff screen), active first, then by name. No password hashes.
drop function if exists usp_user_get_list(uuid);

create function usp_user_get_list(p_gym_id uuid)
returns table (
  id             uuid,
  name           text,
  email          text,
  phone          text,
  role           text,
  is_active      boolean,
  last_login_at  timestamptz,
  created_at     timestamptz
)
language sql stable as $$
  select u.id, u.name, u.email::text, u.phone, u.role, u.is_active, u.last_login_at, u.created_at
  from app_users u
  where u.gym_id = p_gym_id and not u.is_deleted
  order by u.is_active desc, u.name, u.id
$$;
