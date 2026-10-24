-- Oldest pending payments (up to p_limit) plus the total and count of ALL pending payments
-- (DashboardData.pendingPayments.total), repeated on every row.
drop function if exists usp_dashboard_get_pending_payments(uuid, integer);

create function usp_dashboard_get_pending_payments(p_gym_id uuid, p_limit integer default 5)
returns table (
  id             uuid,
  member_name    text,
  amount         integer,
  due_date       date,
  days_overdue   integer,
  total_pending  bigint,
  pending_count  bigint
)
language sql stable as $$
  select
    p.id, c.name, p.amount, p.payment_date,
    greatest(s.today - p.payment_date, 0),
    sum(p.amount) over (),
    count(*) over ()
  from payments p
  join clients c on c.gym_id = p.gym_id and c.id = p.client_id
  cross join (select fn_gym_today(p_gym_id) as today) s
  where p.gym_id = p_gym_id and not p.is_deleted and p.status = 'pending'
  order by p.payment_date, p.id
  limit least(greatest(coalesce(p_limit, 5), 1), 100)
$$;
