-- Payments page, newest date first. p_status: null/'all' | paid | pending;
-- p_method: null/'all' | cash | upi | card | bank. Search: client name or note.
-- days_overdue = days since the due date for pending payments, else 0.
drop function if exists usp_payment_get_paged(uuid, text, integer, integer, text, text);

create function usp_payment_get_paged(
  p_gym_id     uuid,
  p_search     text,
  p_page       integer,
  p_page_size  integer,
  p_status     text default null,
  p_method     text default null
)
returns table (
  id             uuid,
  client_id      uuid,
  client_name    text,
  membership_id  uuid,
  amount         integer,
  method         text,
  status         text,
  payment_date   date,
  note           text,
  days_overdue   integer,
  total_count    bigint
)
language sql stable as $$
  select
    p.id, p.client_id, c.name, p.membership_id, p.amount, p.method, p.status, p.payment_date,
    p.note,
    case when p.status = 'pending' then greatest(s.today - p.payment_date, 0) else 0 end,
    count(*) over ()
  from payments p
  join clients c on c.gym_id = p.gym_id and c.id = p.client_id
  cross join (select fn_like_pattern(p_search) as pat, fn_gym_today(p_gym_id) as today) s
  where p.gym_id = p_gym_id
    and not p.is_deleted
    and (s.pat is null or c.name ilike s.pat or p.note ilike s.pat)
    and (coalesce(nullif(p_status, ''), 'all') = 'all' or p.status = p_status)
    and (coalesce(nullif(p_method, ''), 'all') = 'all' or p.method = p_method)
  order by p.payment_date desc, p.created_at desc
  offset fn_page_offset(p_page, p_page_size)
  limit fn_page_limit(p_page_size)
$$;
