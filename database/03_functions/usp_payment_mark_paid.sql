-- Marks a pending payment paid with today's gym-local date (store.tsx markPaymentPaid).
-- Already-paid payments are left as they are. Returns the id; P0002 if not found.
drop function if exists usp_payment_mark_paid(uuid, uuid);

create function usp_payment_mark_paid(p_gym_id uuid, p_payment_id uuid)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  update payments p
  set status       = 'paid',
      payment_date = case when p.status = 'pending' then fn_gym_today(p_gym_id) else p.payment_date end
  where p.gym_id = p_gym_id and p.id = p_payment_id and not p.is_deleted
  returning p.id into v_id;

  if v_id is null then
    raise exception 'payment % not found', p_payment_id using errcode = 'P0002';
  end if;

  return v_id;
end;
$$;
