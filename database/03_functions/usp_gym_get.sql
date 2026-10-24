-- Gym header (DashboardData.gym) and settings.
drop function if exists usp_gym_get(uuid);

create function usp_gym_get(p_gym_id uuid)
returns table (
  id        uuid,
  name      text,
  branch    text,
  timezone  text,
  currency  text
)
language sql stable as $$
  select g.id, g.name, g.branch, g.timezone, g.currency::text
  from gyms g
  where g.id = p_gym_id and not g.is_deleted
$$;
