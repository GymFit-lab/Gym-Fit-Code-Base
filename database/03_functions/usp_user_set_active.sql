-- Activates or deactivates a staff login. Deactivating revokes its refresh tokens (its current
-- access token expires within minutes, and GET /auth/me rejects it at once). The gym must keep at
-- least one active owner. Returns the id; P0002 if not found; P0004 last active owner.
drop function if exists usp_user_set_active(uuid, uuid, boolean);

create function usp_user_set_active(p_gym_id uuid, p_user_id uuid, p_is_active boolean)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if not p_is_active and exists (
    select 1 from app_users u
    where u.gym_id = p_gym_id and u.id = p_user_id and u.role = 'owner' and u.is_active and not u.is_deleted
  ) and not exists (
    select 1 from app_users o
    where o.gym_id = p_gym_id and o.id <> p_user_id and o.role = 'owner' and o.is_active and not o.is_deleted
  ) then
    raise exception 'the gym needs at least one active owner' using errcode = 'P0004';
  end if;

  update app_users u
  set is_active = p_is_active
  where u.gym_id = p_gym_id and u.id = p_user_id and not u.is_deleted
  returning u.id into v_id;

  if v_id is null then
    raise exception 'user % not found', p_user_id using errcode = 'P0002';
  end if;

  if not p_is_active then
    update refresh_tokens t
    set revoked_at = now()
    where t.gym_id = p_gym_id and t.user_id = p_user_id and t.revoked_at is null;
  end if;

  return v_id;
end;
$$;
