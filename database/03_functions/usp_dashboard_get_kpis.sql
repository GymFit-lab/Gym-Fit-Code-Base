-- The 4 dashboard KPIs (DashboardData.kpis), in display order. "previous" per ANALYSIS.md Q8:
--   activeMembers    value: active + due members now      previous: members on the same day last month
--   revenueThisMonth value: paid this month               previous: paid in the whole of last month
--   checkInsToday    value: check-ins today               previous: daily average of the 30 days before
--   renewalsDue      value: due + overdue renewals now    previous: the same count one week ago
drop function if exists usp_dashboard_get_kpis(uuid);

create function usp_dashboard_get_kpis(p_gym_id uuid)
returns table (id text, value bigint, previous bigint, format text)
language sql stable as $$
  with s as (
    select
      fn_gym_today(p_gym_id) as today,
      date_trunc('month', fn_gym_today(p_gym_id)::timestamp)::date as month_start
  ),
  paid as (
    select p.amount, p.payment_date
    from payments p
    where p.gym_id = p_gym_id and not p.is_deleted and p.status = 'paid'
  ),
  checkins as (
    select a.check_in_date
    from attendance a
    where a.gym_id = p_gym_id and not a.is_deleted
  ),
  k as (
    select
      1 as ord,
      'activeMembers'::text as id,
      (select count(*) from v_active_members v where v.gym_id = p_gym_id)::numeric as value,
      (
        select count(distinct m.client_id)
        from memberships m
        join clients c on c.gym_id = m.gym_id and c.id = m.client_id and not c.is_deleted
        where m.gym_id = p_gym_id
          and not m.is_deleted
          and (s.today - interval '1 month')::date between m.start_date and m.end_date
      )::numeric as previous,
      'number'::text as format
    from s
    union all
    select
      2, 'revenueThisMonth',
      (select coalesce(sum(x.amount), 0) from paid x
        where x.payment_date between s.month_start and s.today),
      (select coalesce(sum(x.amount), 0) from paid x
        where x.payment_date >= (s.month_start - interval '1 month')::date
          and x.payment_date < s.month_start),
      'currency'
    from s
    union all
    select
      3, 'checkInsToday',
      (select count(*) from checkins x where x.check_in_date = s.today),
      (select round(count(*) / 30.0) from checkins x
        where x.check_in_date between s.today - 30 and s.today - 1),
      'number'
    from s
    union all
    select
      4, 'renewalsDue',
      (select count(*) from v_client_current_membership v
        where v.gym_id = p_gym_id and v.end_date between s.today - 7 and s.today + 7),
      (select count(*) from v_client_current_membership v
        where v.gym_id = p_gym_id and v.end_date between s.today - 14 and s.today),
      'number'
    from s
  )
  select k.id, k.value::bigint, k.previous::bigint, k.format
  from k
  order by k.ord
$$;
