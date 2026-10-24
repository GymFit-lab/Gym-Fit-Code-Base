-- Looks up a refresh token by hash (no gym yet: the token identifies the user).
-- The API rejects it when revoked_at is set or expires_at has passed.
drop function if exists usp_refresh_token_get(text);

create function usp_refresh_token_get(p_token_hash text)
returns table (
  id          uuid,
  gym_id      uuid,
  user_id     uuid,
  expires_at  timestamptz,
  revoked_at  timestamptz
)
language sql stable as $$
  select t.id, t.gym_id, t.user_id, t.expires_at, t.revoked_at
  from refresh_tokens t
  where t.token_hash = p_token_hash and not t.is_deleted
$$;
