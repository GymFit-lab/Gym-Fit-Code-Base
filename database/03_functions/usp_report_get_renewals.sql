-- Upcoming renewals: current memberships ending between today and today + p_days, soonest first
-- (selectors.ts upcomingRenewals). amount = the plan's current price.
drop function if exists usp_report_get_renewals(uuid, integer);

create function usp_report_get_renewals(p_gym_id uuid, p_days integer default 14)
returns table (
  client_id    uuid,
  client_name  text,
  plan_name    text,
  end_date     date,
  amount       integer,
  days_left    integer
)
language sql stable as $$
  select v.client_id, v.name, v.plan_name, v.end_date, coalesce(p.price, v.amount), v.days_left
  from v_client_current_membership v
  left join membership_plans p on p.gym_id = v.gym_id and p.id = v.plan_id and not p.is_deleted
  where v.gym_id = p_gym_id
    and v.end_date between v.today and v.today + greatest(coalesce(p_days, 14), 0)
  order by v.end_date, v.name
$$;
