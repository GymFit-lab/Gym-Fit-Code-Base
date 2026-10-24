-- Alternative login check done in the DB: returns the user (without the hash) only when the
-- password matches and the user is active. Zero rows = invalid credentials.
drop function if exists usp_user_verify_password(citext, text);

create function usp_user_verify_password(p_email citext, p_password text)
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
  join gyms g on g.id = u.gym_id and not g.is_deleted
  where u.email = btrim(p_email)::citext
    and not u.is_deleted
    and u.is_active
    and u.password_hash is not null
    and u.password_hash = crypt(p_password, u.password_hash)
$$;
