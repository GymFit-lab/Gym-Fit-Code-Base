-- Latest check-ins with the client's trainer, newest first.
drop function if exists usp_dashboard_get_recent_checkins(uuid, integer);

create function usp_dashboard_get_recent_checkins(p_gym_id uuid, p_limit integer default 8)
returns table (id uuid, member_name text, checked_in_at timestamptz, trainer_name text)
language sql stable as $$
  select a.id, c.name, a.checked_in_at, t.name
  from attendance a
  join clients c on c.gym_id = a.gym_id and c.id = a.client_id and not c.is_deleted
  left join trainers t on t.gym_id = c.gym_id and t.id = c.trainer_id and not t.is_deleted
  where a.gym_id = p_gym_id and not a.is_deleted
  order by a.checked_in_at desc, a.id
  limit least(greatest(coalesce(p_limit, 8), 1), 100)
$$;
