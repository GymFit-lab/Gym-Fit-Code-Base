-- Insert (p_measurement_id null) or update a body measurement. Returns the id.
-- p_measured_on null = gym-local today. 23505 if the client already has one on that date.
drop function if exists usp_body_measurement_save(
  uuid, uuid, uuid, date, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text
);

create function usp_body_measurement_save(
  p_gym_id          uuid,
  p_measurement_id  uuid,
  p_client_id       uuid,
  p_measured_on     date,
  p_weight_kg       numeric,
  p_height_cm       numeric,
  p_body_fat_pct    numeric,
  p_chest_cm        numeric,
  p_waist_cm        numeric,
  p_hips_cm         numeric,
  p_arm_cm          numeric,
  p_thigh_cm        numeric,
  p_notes           text
)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from clients c where c.gym_id = p_gym_id and c.id = p_client_id and not c.is_deleted
  ) then
    raise exception 'client % not found', p_client_id using errcode = 'P0002';
  end if;

  if p_measurement_id is null then
    insert into body_measurements (
      gym_id, client_id, measured_on, weight_kg, height_cm, body_fat_pct,
      chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes
    )
    values (
      p_gym_id, p_client_id, coalesce(p_measured_on, fn_gym_today(p_gym_id)), p_weight_kg,
      p_height_cm, p_body_fat_pct, p_chest_cm, p_waist_cm, p_hips_cm, p_arm_cm, p_thigh_cm,
      coalesce(btrim(p_notes), '')
    )
    returning id into v_id;
  else
    update body_measurements b
    set client_id    = p_client_id,
        measured_on  = coalesce(p_measured_on, b.measured_on),
        weight_kg    = p_weight_kg,
        height_cm    = p_height_cm,
        body_fat_pct = p_body_fat_pct,
        chest_cm     = p_chest_cm,
        waist_cm     = p_waist_cm,
        hips_cm      = p_hips_cm,
        arm_cm       = p_arm_cm,
        thigh_cm     = p_thigh_cm,
        notes        = coalesce(btrim(p_notes), '')
    where b.gym_id = p_gym_id and b.id = p_measurement_id and not b.is_deleted
    returning b.id into v_id;

    if v_id is null then
      raise exception 'measurement % not found', p_measurement_id using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;
