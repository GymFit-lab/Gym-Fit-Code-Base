-- A client's body measurements, newest first.
drop function if exists usp_body_measurement_get_by_client(uuid, uuid);

create function usp_body_measurement_get_by_client(p_gym_id uuid, p_client_id uuid)
returns table (
  id            uuid,
  client_id     uuid,
  measured_on   date,
  weight_kg     numeric,
  height_cm     numeric,
  body_fat_pct  numeric,
  chest_cm      numeric,
  waist_cm      numeric,
  hips_cm       numeric,
  arm_cm        numeric,
  thigh_cm      numeric,
  notes         text
)
language sql stable as $$
  select
    b.id, b.client_id, b.measured_on, b.weight_kg, b.height_cm, b.body_fat_pct,
    b.chest_cm, b.waist_cm, b.hips_cm, b.arm_cm, b.thigh_cm, b.notes
  from body_measurements b
  where b.gym_id = p_gym_id and b.client_id = p_client_id and not b.is_deleted
  order by b.measured_on desc
$$;
