-- Active + due members grouped by their current plan, largest first.
drop function if exists usp_dashboard_get_members_by_plan(uuid);

create function usp_dashboard_get_members_by_plan(p_gym_id uuid)
returns table (plan_id uuid, plan_name text, member_count bigint)
language sql stable as $$
  select v.plan_id, v.plan_name, count(*)
  from v_active_members v
  where v.gym_id = p_gym_id
  group by v.plan_id, v.plan_name
  order by 3 desc, 2
$$;
