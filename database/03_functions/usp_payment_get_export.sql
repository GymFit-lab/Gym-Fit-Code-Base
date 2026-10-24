-- All payments for the CSV export (date, client, method, status, amount, note), newest first.
drop function if exists usp_payment_get_export(uuid);

create function usp_payment_get_export(p_gym_id uuid)
returns table (
  payment_date  date,
  client_name   text,
  method        text,
  status        text,
  amount        integer,
  note          text
)
language sql stable as $$
  select p.payment_date, c.name, p.method, p.status, p.amount, p.note
  from payments p
  join clients c on c.gym_id = p.gym_id and c.id = p.client_id
  where p.gym_id = p_gym_id and not p.is_deleted
  order by p.payment_date desc, p.created_at desc
$$;
