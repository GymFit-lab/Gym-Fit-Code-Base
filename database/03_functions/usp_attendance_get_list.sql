-- Raw check-ins for the last p_days gym-local days (today included), newest first. Feeds the
-- frontend store's GymData.attendance bootstrap (its pages look back at most 30 days).
drop function if exists usp_attendance_get_list(uuid, integer);

create function usp_attendance_get_list(p_gym_id uuid, p_days integer default 90)
returns table (id uuid, client_id uuid, checked_in_at timestamptz)
language sql stable as $$
  select a.id, a.client_id, a.checked_in_at
  from attendance a
  join clients c on c.gym_id = a.gym_id and c.id = a.client_id and not c.is_deleted
  where a.gym_id = p_gym_id
    and not a.is_deleted
    and a.check_in_date > fn_gym_today(p_gym_id) - least(greatest(coalesce(p_days, 90), 1), 3660)
  order by a.checked_in_at desc
$$;
