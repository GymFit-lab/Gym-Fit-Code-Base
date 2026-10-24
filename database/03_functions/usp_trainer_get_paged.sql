-- Trainers page: trainer + assigned client count + check-ins by those clients in the last 7 days
-- (today and the 6 days before, as lastDays(7) in trainers-view.tsx). Search: name or specialty.
drop function if exists usp_trainer_get_paged(uuid, text, integer, integer);

create function usp_trainer_get_paged(
  p_gym_id     uuid,
  p_search     text,
  p_page       integer,
  p_page_size  integer
)
returns table (
  id                     uuid,
  name                   text,
  specialty              text,
  phone                  text,
  email                  text,
  joined_on              date,
  client_count           bigint,
  check_ins_last_7_days  bigint,
  total_count            bigint
)
language sql stable as $$
  select
    t.id, t.name, t.specialty, t.phone, t.email::text, t.joined_on,
    cc.client_count,
    ci.check_ins,
    count(*) over ()
  from trainers t
  cross join (select fn_like_pattern(p_search) as pat, fn_gym_today(p_gym_id) as today) s
  cross join lateral (
    select count(*) as client_count
    from clients c
    where c.gym_id = t.gym_id and c.trainer_id = t.id and not c.is_deleted
  ) cc
  cross join lateral (
    select count(*) as check_ins
    from attendance a
    join clients c on c.gym_id = a.gym_id and c.id = a.client_id and not c.is_deleted
    where a.gym_id = t.gym_id
      and c.trainer_id = t.id
      and not a.is_deleted
      and a.check_in_date between s.today - 6 and s.today
  ) ci
  where t.gym_id = p_gym_id
    and not t.is_deleted
    and (s.pat is null or t.name ilike s.pat or t.specialty ilike s.pat)
  order by t.name, t.id
  offset fn_page_offset(p_page, p_page_size)
  limit fn_page_limit(p_page_size)
$$;
