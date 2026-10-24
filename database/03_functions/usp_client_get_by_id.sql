-- One client row (same shape as usp_client_get_paged, without total_count).
drop function if exists usp_client_get_by_id(uuid, uuid);

create function usp_client_get_by_id(p_gym_id uuid, p_client_id uuid)
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
  status         text
)
language sql stable as $$
  select
    v.client_id, v.name, v.phone, v.email::text, v.gender, v.joined_on,
    v.trainer_id, v.trainer_name,
    v.membership_id, v.plan_id, v.plan_name, v.start_date, v.end_date, v.amount,
    v.status
  from v_client_current_membership v
  where v.gym_id = p_gym_id and v.client_id = p_client_id
$$;
