-- Today's busiest gym-local hour (0-23). No row when nobody has checked in today.
drop function if exists usp_attendance_get_peak_hour(uuid);

create function usp_attendance_get_peak_hour(p_gym_id uuid)
returns table (peak_hour integer, check_in_count bigint)
language sql stable as $$
  select extract(hour from a.checked_in_at at time zone g.timezone)::integer, count(*)
  from attendance a
  join gyms g on g.id = a.gym_id
  where a.gym_id = p_gym_id
    and not a.is_deleted
    and a.check_in_date = fn_gym_today(p_gym_id)
  group by 1
  order by 2 desc, 1
  limit 1
$$;
