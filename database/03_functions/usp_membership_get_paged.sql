-- Memberships page: each membership with client/plan name and its own status.
-- p_status: null/'all' | active | due | expired. Search: client name. Newest start first.
drop function if exists usp_membership_get_paged(uuid, text, integer, integer, text, uuid);

create function usp_membership_get_paged(
  p_gym_id     uuid,
  p_search     text,
  p_page       integer,
  p_page_size  integer,
  p_status     text default null,
  p_plan_id    uuid default null
)
returns table (
  id           uuid,
  client_id    uuid,
  client_name  text,
  plan_id      uuid,
  plan_name    text,
  start_date   date,
  end_date     date,
  amount       integer,
  status       text,
  total_count  bigint
)
language sql stable as $$
  select
    m.id, m.client_id, c.name, m.plan_id, p.name, m.start_date, m.end_date, m.amount,
    x.status,
    count(*) over ()
  from memberships m
  join clients c on c.gym_id = m.gym_id and c.id = m.client_id and not c.is_deleted
  join membership_plans p on p.gym_id = m.gym_id and p.id = m.plan_id
  cross join (select fn_like_pattern(p_search) as pat, fn_gym_today(p_gym_id) as today) s
  cross join lateral (select fn_membership_status(m.end_date, s.today) as status) x
  where m.gym_id = p_gym_id
    and not m.is_deleted
    and (s.pat is null or c.name ilike s.pat)
    and (coalesce(nullif(p_status, ''), 'all') = 'all' or x.status = p_status)
    and (p_plan_id is null or m.plan_id = p_plan_id)
  order by m.start_date desc, m.created_at desc
  offset fn_page_offset(p_page, p_page_size)
  limit fn_page_limit(p_page_size)
$$;
