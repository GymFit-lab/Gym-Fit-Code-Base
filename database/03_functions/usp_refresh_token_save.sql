-- Stores a new refresh token hash. Returns its id.
drop function if exists usp_refresh_token_save(uuid, uuid, text, timestamptz);

create function usp_refresh_token_save(
  p_gym_id      uuid,
  p_user_id     uuid,
  p_token_hash  text,
  p_expires_at  timestamptz
)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  insert into refresh_tokens (gym_id, user_id, token_hash, expires_at)
  values (p_gym_id, p_user_id, p_token_hash, p_expires_at)
  returning id into v_id;
  return v_id;
end;
$$;
