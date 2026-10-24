-- Revokes a refresh token (logout / rotation). Returns true if a live token was revoked.
drop function if exists usp_refresh_token_revoke(uuid, text);

create function usp_refresh_token_revoke(p_gym_id uuid, p_token_hash text)
returns boolean
language plpgsql as $$
begin
  update refresh_tokens t
  set revoked_at = now()
  where t.gym_id = p_gym_id and t.token_hash = p_token_hash and t.revoked_at is null;
  return found;
end;
$$;
