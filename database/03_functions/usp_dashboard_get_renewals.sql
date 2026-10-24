-- Dashboard renewals: current memberships ending in the next 7 days (due) or that ended in the
-- last 7 days without a newer one (overdue). amount = the plan's current price. Soonest first.
drop function if exists usp_dashboard_get_renewals(uuid);

create function usp_dashboard_get_renewals(p_gym_id uuid)
returns table (
  id           uuid,
  client_id    uuid,
  member_name  text,
  plan         text,
  due_date     date,
  amount       integer,
  status       text
)
language sql stable as $$
  select
    v.membership_id, v.client_id, v.name, v.plan_name, v.end_date,
    coalesce(p.price, v.amount),
    case when v.end_date >= v.today then 'due' else 'overdue' end
  from v_client_current_membership v
  left join membership_plans p on p.gym_id = v.gym_id and p.id = v.plan_id and not p.is_deleted
  where v.gym_id = p_gym_id
    and v.end_date between v.today - 7 and v.today + 7
  order by v.end_date, v.name
$$;
