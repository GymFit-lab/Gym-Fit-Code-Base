-- Clients page: client + current membership + plan + trainer + derived status.
-- p_status: null/'all' | active | due | expired | none. p_trainer_id: null/'all' | 'none' | <uuid>.
-- Search matches name, phone or email. Ordered by name.
drop function if exists usp_client_get_paged(uuid, text, integer, integer, text, text);

create function usp_client_get_paged(
  p_gym_id      uuid,
  p_search      text,
  p_page        integer,
  p_page_size   integer,
  p_status      text default null,
  p_trainer_id  text default null
)
returns table (
  id             uuid,
  name           text,
  phone          text,
  email          text,
  gender         text,
  joined_on      date,
  trainer_id     uuid,
  trainer_name   text,
  membership_id  uuid,
  plan_id        uuid,
  plan_name      text,
  start_date     date,
  end_date       date,
  amount         integer,
  status         text,
  total_count    bigint
)
language sql stable as $$
  select
    v.client_id, v.name, v.phone, v.email::text, v.gender, v.joined_on,
    v.trainer_id, v.trainer_name,
    v.membership_id, v.plan_id, v.plan_name, v.start_date, v.end_date, v.amount,
    v.status,
    count(*) over ()
  from v_client_current_membership v
  cross join (select fn_like_pattern(p_search) as pat) s
  where v.gym_id = p_gym_id
    and (s.pat is null or v.name ilike s.pat or v.phone ilike s.pat or v.email ilike s.pat)
    and (coalesce(nullif(p_status, ''), 'all') = 'all' or v.status = p_status)
    and (
      coalesce(nullif(p_trainer_id, ''), 'all') = 'all'
      or (p_trainer_id = 'none' and v.trainer_id is null)
      or v.trainer_id::text = p_trainer_id
    )
  order by v.name, v.client_id
  offset fn_page_offset(p_page, p_page_size)
  limit fn_page_limit(p_page_size)
$$;
