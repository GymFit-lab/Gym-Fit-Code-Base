-- Current user for GET /auth/me.
drop function if exists usp_user_get_by_id(uuid, uuid);

create function usp_user_get_by_id(p_gym_id uuid, p_user_id uuid)
returns table (
  id         uuid,
  gym_id     uuid,
  name       text,
  email      text,
  role       text,
  is_active  boolean
)
language sql stable as $$
  select u.id, u.gym_id, u.name, u.email::text, u.role, u.is_active
  from app_users u
  where u.gym_id = p_gym_id and u.id = p_user_id and not u.is_deleted
$$;
