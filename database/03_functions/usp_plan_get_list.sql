-- Plans with the number of memberships running today (start <= today <= end), as
-- memberships-view.tsx activeOn(). Ordered by duration.
drop function if exists usp_plan_get_list(uuid);

create function usp_plan_get_list(p_gym_id uuid)
returns table (
  id               uuid,
  name             text,
  duration_months  integer,
  price            integer,
  active_count     bigint
)
language sql stable as $$
  select
    p.id, p.name, p.duration_months, p.price,
    (
      select count(*)
      from memberships m
      join clients c on c.gym_id = m.gym_id and c.id = m.client_id and not c.is_deleted
      where m.gym_id = p.gym_id
        and m.plan_id = p.id
        and not m.is_deleted
        and fn_gym_today(p_gym_id) between m.start_date and m.end_date
    )
  from membership_plans p
  where p.gym_id = p_gym_id and not p.is_deleted
  order by p.duration_months, p.name
$$;
