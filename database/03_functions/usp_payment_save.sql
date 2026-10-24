-- Insert (p_payment_id null) or update a payment. Returns the id.
-- p_payment_date null = gym-local today. An update keeps the payment's membership link.
drop function if exists usp_payment_save(uuid, uuid, uuid, integer, text, text, date, text);

create function usp_payment_save(
  p_gym_id        uuid,
  p_payment_id    uuid,
  p_client_id     uuid,
  p_amount        integer,
  p_method        text,
  p_status        text,
  p_payment_date  date,
  p_note          text
)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from clients c where c.gym_id = p_gym_id and c.id = p_client_id and not c.is_deleted
  ) then
    raise exception 'client % not found', p_client_id using errcode = 'P0002';
  end if;

  if p_payment_id is null then
    insert into payments (gym_id, client_id, amount, method, status, payment_date, note)
    values (
      p_gym_id, p_client_id, p_amount, p_method, p_status,
      coalesce(p_payment_date, fn_gym_today(p_gym_id)), coalesce(btrim(p_note), '')
    )
    returning id into v_id;
  else
    update payments p
    set client_id    = p_client_id,
        amount       = p_amount,
        method       = p_method,
        status       = p_status,
        payment_date = coalesce(p_payment_date, p.payment_date),
        note         = coalesce(btrim(p_note), '')
    where p.gym_id = p_gym_id and p.id = p_payment_id and not p.is_deleted
    returning p.id into v_id;

    if v_id is null then
      raise exception 'payment % not found', p_payment_id using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;
