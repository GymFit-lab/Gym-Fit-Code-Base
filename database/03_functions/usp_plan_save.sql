-- Insert (p_plan_id null) or update a membership plan. Returns the id.
-- Changing the price does not touch existing memberships (they keep their own amount).
drop function if exists usp_plan_save(uuid, uuid, text, integer, integer);

create function usp_plan_save(
  p_gym_id           uuid,
  p_plan_id          uuid,
  p_name             text,
  p_duration_months  integer,
  p_price            integer
)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if p_plan_id is null then
    insert into membership_plans (gym_id, name, duration_months, price)
    values (p_gym_id, btrim(p_name), p_duration_months, p_price)
    returning id into v_id;
  else
    update membership_plans p
    set name            = btrim(p_name),
        duration_months = p_duration_months,
        price           = p_price
    where p.gym_id = p_gym_id and p.id = p_plan_id and not p.is_deleted
    returning p.id into v_id;

    if v_id is null then
      raise exception 'plan % not found', p_plan_id using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;
