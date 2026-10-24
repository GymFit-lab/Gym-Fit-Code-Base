-- Insert (p_client_id null) or update a client. Returns the id.
-- Errors: P0002 client/trainer not found; 23505 duplicate phone/email in this gym; 23514 invalid value.
drop function if exists usp_client_save(uuid, uuid, text, text, text, text, uuid);

create function usp_client_save(
  p_gym_id      uuid,
  p_client_id   uuid,
  p_name        text,
  p_phone       text,
  p_email       text,
  p_gender      text,
  p_trainer_id  uuid
)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if p_trainer_id is not null and not exists (
    select 1 from trainers t
    where t.gym_id = p_gym_id and t.id = p_trainer_id and not t.is_deleted
  ) then
    raise exception 'trainer % not found', p_trainer_id using errcode = 'P0002';
  end if;

  if p_client_id is null then
    insert into clients (gym_id, name, phone, email, gender, joined_on, trainer_id)
    values (
      p_gym_id, btrim(p_name), btrim(p_phone), nullif(btrim(p_email), ''), lower(btrim(p_gender)),
      fn_gym_today(p_gym_id), p_trainer_id
    )
    returning id into v_id;
  else
    update clients c
    set name       = btrim(p_name),
        phone      = btrim(p_phone),
        email      = nullif(btrim(p_email), ''),
        gender     = lower(btrim(p_gender)),
        trainer_id = p_trainer_id
    where c.gym_id = p_gym_id and c.id = p_client_id and not c.is_deleted
    returning c.id into v_id;

    if v_id is null then
      raise exception 'client % not found', p_client_id using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;
