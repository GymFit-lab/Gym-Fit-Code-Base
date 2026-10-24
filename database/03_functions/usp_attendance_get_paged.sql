-- Attendance page: check-ins on one gym-local date (null = today), newest first, with the
-- client's current status/plan/trainer. Search: client name.
drop function if exists usp_attendance_get_paged(uuid, text, integer, integer, date);

create function usp_attendance_get_paged(
  p_gym_id     uuid,
  p_search     text,
  p_page       integer,
  p_page_size  integer,
  p_date       date default null
)
returns table (
  id             uuid,
  checked_in_at  timestamptz,
  client_id      uuid,
  client_name    text,
  client_status  text,
  plan_name      text,
  trainer_name   text,
  total_count    bigint
)
language sql stable as $$
  select
    a.id, a.checked_in_at, a.client_id, v.name, v.status, v.plan_name, v.trainer_name,
    count(*) over ()
  from attendance a
  cross join (
    select fn_like_pattern(p_search) as pat, coalesce(p_date, fn_gym_today(p_gym_id)) as day
  ) s
  join v_client_current_membership v on v.gym_id = a.gym_id and v.client_id = a.client_id
  where a.gym_id = p_gym_id
    and not a.is_deleted
    and a.check_in_date = s.day
    and (s.pat is null or v.name ilike s.pat)
  order by a.checked_in_at desc, a.id
  offset fn_page_offset(p_page, p_page_size)
  limit fn_page_limit(p_page_size)
$$;
