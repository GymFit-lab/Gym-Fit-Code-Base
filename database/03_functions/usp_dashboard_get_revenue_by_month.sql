-- Paid revenue for the last p_months gym-local months ('YYYY-MM'), oldest first, zero-filled.
-- Used by the dashboard (6) and the reports page (6).
drop function if exists usp_dashboard_get_revenue_by_month(uuid, integer);

create function usp_dashboard_get_revenue_by_month(p_gym_id uuid, p_months integer default 6)
returns table (revenue_month text, amount bigint)
language sql stable as $$
  select to_char(mm.month_start, 'YYYY-MM'), coalesce(sum(p.amount), 0)
  from (select date_trunc('month', fn_gym_today(p_gym_id)::timestamp) as this_month) s
  cross join generate_series(least(greatest(coalesce(p_months, 6), 1), 36) - 1, 0, -1) as g (n)
  cross join lateral (
    select (s.this_month - make_interval(months => g.n))::date as month_start
  ) mm
  left join payments p
    on p.gym_id = p_gym_id
    and not p.is_deleted
    and p.status = 'paid'
    and p.payment_date >= mm.month_start
    and p.payment_date < (mm.month_start + interval '1 month')::date
  group by mm.month_start
  order by mm.month_start
$$;
