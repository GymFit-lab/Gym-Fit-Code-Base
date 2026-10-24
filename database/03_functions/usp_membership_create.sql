-- Sells a membership and records its payment in one transaction (store.tsx addMembership):
-- end_date = start + plan months - 1 day, amount = plan price, payment note = plan name,
-- payment date = start date. p_start_date null = gym-local today.
drop function if exists usp_membership_create(uuid, uuid, uuid, date, text, text);

create function usp_membership_create(
  p_gym_id          uuid,
  p_client_id       uuid,
  p_plan_id         uuid,
  p_start_date      date,
  p_payment_status  text,
  p_method          text
)
returns table (membership_id uuid, payment_id uuid)
language plpgsql as $$
#variable_conflict use_column
declare
  v_plan   membership_plans%rowtype;
  v_start  date := coalesce(p_start_date, fn_gym_today(p_gym_id));
  v_mid    uuid;
  v_pid    uuid;
begin
  select * into v_plan
  from membership_plans mp
  where mp.gym_id = p_gym_id and mp.id = p_plan_id and not mp.is_deleted;
  if not found then
    raise exception 'plan % not found', p_plan_id using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from clients c where c.gym_id = p_gym_id and c.id = p_client_id and not c.is_deleted
  ) then
    raise exception 'client % not found', p_client_id using errcode = 'P0002';
  end if;

  insert into memberships (gym_id, client_id, plan_id, start_date, end_date, amount)
  values (
    p_gym_id, p_client_id, p_plan_id, v_start,
    (v_start + make_interval(months => v_plan.duration_months))::date - 1,
    v_plan.price
  )
  returning id into v_mid;

  insert into payments (gym_id, client_id, membership_id, amount, method, status, payment_date, note)
  values (p_gym_id, p_client_id, v_mid, v_plan.price, p_method, p_payment_status, v_start, v_plan.name)
  returning id into v_pid;

  membership_id := v_mid;
  payment_id := v_pid;
  return next;
end;
$$;
