-- Replaces a login's password (bcrypt hash made by the API) and revokes its refresh tokens, so
-- other devices must sign in again. Returns the id; P0002 if not found.
drop function if exists usp_user_set_password(uuid, uuid, text);

create function usp_user_set_password(p_gym_id uuid, p_user_id uuid, p_password_hash text)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  update app_users u
  set password_hash = p_password_hash
  where u.gym_id = p_gym_id and u.id = p_user_id and not u.is_deleted
  returning u.id into v_id;

  if v_id is null then
    raise exception 'user % not found', p_user_id using errcode = 'P0002';
  end if;

  update refresh_tokens t
  set revoked_at = now()
  where t.gym_id = p_gym_id and t.user_id = p_user_id and t.revoked_at is null;

  return v_id;
end;
$$;
