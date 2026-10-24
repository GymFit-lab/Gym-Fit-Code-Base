-- Reports stat tiles (reports-view.tsx): paid this month, clients joined this month, all pending,
-- and the 90-day renewal rate = share of memberships that ended in the last 90 days and were
-- followed by another starting within 30 days of the end (null when none ended).
drop function if exists usp_report_get_summary(uuid);

create function usp_report_get_summary(p_gym_id uuid)
returns table (
  this_month     bigint,
  new_clients    bigint,
  outstanding    bigint,
  retention_pct  integer
)
language sql stable as $$
  with s as (
    select
      fn_gym_today(p_gym_id) as today,
      date_trunc('month', fn_gym_today(p_gym_id)::timestamp)::date as month_start
  ),
  ended as (
    select exists (
      select 1
      from memberships n
      where n.gym_id = m.gym_id
        and n.client_id = m.client_id
        and not n.is_deleted
        and n.end_date > m.end_date
        and n.start_date <= m.end_date + 30
    ) as renewed
    from memberships m
    join clients c on c.gym_id = m.gym_id and c.id = m.client_id and not c.is_deleted
    cross join s
    where m.gym_id = p_gym_id
      and not m.is_deleted
      and m.end_date < s.today
      and m.end_date >= s.today - 90
  )
  select
    (select coalesce(sum(p.amount), 0) from payments p
      where p.gym_id = p_gym_id and not p.is_deleted and p.status = 'paid'
        and p.payment_date >= s.month_start
        and p.payment_date < (s.month_start + interval '1 month')::date),
    (select count(*) from clients c
      where c.gym_id = p_gym_id and not c.is_deleted
        and c.joined_on >= s.month_start
        and c.joined_on < (s.month_start + interval '1 month')::date),
    (select coalesce(sum(p.amount), 0) from payments p
      where p.gym_id = p_gym_id and not p.is_deleted and p.status = 'pending'),
    (select case when count(*) = 0 then null
       else round(100.0 * count(*) filter (where e.renewed) / count(*))::integer end
     from ended e)
  from s
$$;
