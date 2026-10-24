-- Checks a client in now. Returns the attendance id.
-- A second check-in on the same gym-local day raises SQLSTATE 23505 on constraint
-- uq_attendance_client_day; the API maps it to 409 { code: "DUPLICATE_CHECKIN" }.
drop function if exists usp_attendance_check_in(uuid, uuid);

create function usp_attendance_check_in(p_gym_id uuid, p_client_id uuid)
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

  insert into attendance (gym_id, client_id, checked_in_at, check_in_date)
  values (p_gym_id, p_client_id, now(), fn_gym_today(p_gym_id))
  returning id into v_id;

  return v_id;
end;
$$;
