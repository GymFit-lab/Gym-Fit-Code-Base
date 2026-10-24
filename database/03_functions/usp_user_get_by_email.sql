-- Login lookup. No p_gym_id: the gym is only known once the user is found.
-- The API compares p_password with password_hash using bcrypt.compare().
drop function if exists usp_user_get_by_email(citext);

create function usp_user_get_by_email(p_email citext)
returns table (
  id             uuid,
  gym_id         uuid,
  name           text,
  email          text,
  role           text,
  password_hash  text,
  is_active      boolean
)
language sql stable as $$
  select u.id, u.gym_id, u.name, u.email::text, u.role, u.password_hash, u.is_active
  from app_users u
  join gyms g on g.id = u.gym_id and not g.is_deleted
  where u.email = btrim(p_email)::citext and not u.is_deleted
$$;
