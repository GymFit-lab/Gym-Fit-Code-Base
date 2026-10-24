-- Insert (p_trainer_id null) or update a trainer. Returns the id.
drop function if exists usp_trainer_save(uuid, uuid, text, text, text, text);

create function usp_trainer_save(
  p_gym_id      uuid,
  p_trainer_id  uuid,
  p_name        text,
  p_specialty   text,
  p_phone       text,
  p_email       text
)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if p_trainer_id is null then
    insert into trainers (gym_id, name, specialty, phone, email, joined_on)
    values (
      p_gym_id, btrim(p_name), btrim(p_specialty), btrim(p_phone), nullif(btrim(p_email), ''),
      fn_gym_today(p_gym_id)
    )
    returning id into v_id;
  else
    update trainers t
    set name      = btrim(p_name),
        specialty = btrim(p_specialty),
        phone     = btrim(p_phone),
        email     = nullif(btrim(p_email), '')
    where t.gym_id = p_gym_id and t.id = p_trainer_id and not t.is_deleted
    returning t.id into v_id;

    if v_id is null then
      raise exception 'trainer % not found', p_trainer_id using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;
