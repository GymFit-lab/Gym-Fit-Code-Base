-- Paid amounts per payment method over the last 365 days (methods with no payments are omitted).
drop function if exists usp_report_get_paid_by_method(uuid);

create function usp_report_get_paid_by_method(p_gym_id uuid)
returns table (method text, amount bigint)
language sql stable as $$
  select p.method, sum(p.amount)
  from payments p
  where p.gym_id = p_gym_id
    and not p.is_deleted
    and p.status = 'paid'
    and p.payment_date >= fn_gym_today(p_gym_id) - 365
  group by p.method
  order by 2 desc, 1
$$;
