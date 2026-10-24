-- Soft-deletes a client. Returns the id; P0002 if not found.
drop function if exists usp_client_delete(uuid, uuid);

create function usp_client_delete(p_gym_id uuid, p_client_id uuid)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  update clients c
  set is_deleted = true
  where c.gym_id = p_gym_id and c.id = p_client_id and not c.is_deleted
  returning c.id into v_id;

  if v_id is null then
    raise exception 'client % not found', p_client_id using errcode = 'P0002';
  end if;

  return v_id;
end;
$$;
