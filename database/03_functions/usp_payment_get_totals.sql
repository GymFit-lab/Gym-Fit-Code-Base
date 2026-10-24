-- Payments page totals (meta.totals): paid in the current gym-local month, and all pending.
drop function if exists usp_payment_get_totals(uuid);

create function usp_payment_get_totals(p_gym_id uuid)
returns table (paid_this_month bigint, pending_total bigint, pending_count bigint)
language sql stable as $$
  select
    coalesce(sum(p.amount) filter (
      where p.status = 'paid'
        and date_trunc('month', p.payment_date::timestamp) = date_trunc('month', s.today::timestamp)
    ), 0),
    coalesce(sum(p.amount) filter (where p.status = 'pending'), 0),
    count(*) filter (where p.status = 'pending')
  from (select fn_gym_today(p_gym_id) as today) s
  left join payments p on p.gym_id = p_gym_id and not p.is_deleted
$$;
