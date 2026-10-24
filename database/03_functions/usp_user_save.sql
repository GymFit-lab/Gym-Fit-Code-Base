-- Insert (p_user_id null) or update a staff login. Returns the id.
-- p_password_hash: bcrypt hash made by the API ($2a$), required on insert, ignored on update
-- (passwords change through usp_user_set_password). The gym must keep at least one active owner.
-- Errors: P0002 user not found; P0004 last active owner; 23505 email already used (uq_app_users_email);
-- 23514 invalid email/phone/role/name.
drop function if exists usp_user_save(uuid, uuid, text, citext, text, text, text);

create function usp_user_save(
  p_gym_id         uuid,
  p_user_id        uuid,
  p_name           text,
  p_email          citext,
  p_phone          text,
  p_role           text,
  p_password_hash  text
)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if p_user_id is null then
    if p_password_hash is null or p_password_hash = '' then
      raise exception 'a password is required for a new login' using errcode = '23514';
    end if;

    insert into app_users (gym_id, name, email, phone, password_hash, role)
    values (p_gym_id, btrim(p_name), btrim(p_email)::citext, nullif(btrim(p_phone), ''), p_password_hash, p_role)
    returning id into v_id;
  else
    if p_role <> 'owner' and not exists (
      select 1 from app_users o
      where o.gym_id = p_gym_id and o.id <> p_user_id and o.role = 'owner' and o.is_active and not o.is_deleted
    ) and exists (
      select 1 from app_users u
      where u.gym_id = p_gym_id and u.id = p_user_id and u.role = 'owner' and u.is_active and not u.is_deleted
    ) then
      raise exception 'the gym needs at least one active owner' using errcode = 'P0004';
    end if;

    update app_users u
    set name  = btrim(p_name),
        email = btrim(p_email)::citext,
        phone = nullif(btrim(p_phone), ''),
        role  = p_role
    where u.gym_id = p_gym_id and u.id = p_user_id and not u.is_deleted
    returning u.id into v_id;

    if v_id is null then
      raise exception 'user % not found', p_user_id using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;
