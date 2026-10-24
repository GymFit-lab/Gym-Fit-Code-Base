-- Check-ins per gym-local day for the last p_days days (ending today), zero-filled, oldest first.
-- Dashboard uses 7, Reports 14, Attendance 30.
drop function if exists usp_attendance_get_daily(uuid, integer);

create function usp_attendance_get_daily(p_gym_id uuid, p_days integer default 7)
returns table (check_in_date date, check_in_count bigint)
language sql stable as $$
  select s.today - g.n, count(a.id)
  from (select fn_gym_today(p_gym_id) as today) s
  cross join generate_series(least(greatest(coalesce(p_days, 7), 1), 366) - 1, 0, -1) as g (n)
  left join attendance a
    on a.gym_id = p_gym_id and not a.is_deleted and a.check_in_date = s.today - g.n
  group by s.today, g.n
  order by g.n desc
$$;
