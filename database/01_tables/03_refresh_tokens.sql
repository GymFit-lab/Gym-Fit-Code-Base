-- Refresh tokens, stored as a hash (sha256 by the API), never in plain text.
create table if not exists refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null,
  user_id     uuid not null,
  token_hash  text not null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint uq_refresh_tokens_hash unique (token_hash),
  constraint fk_refresh_tokens_user foreign key (gym_id, user_id) references app_users (gym_id, id)
);

create index if not exists ix_refresh_tokens_gym_user on refresh_tokens (gym_id, user_id);

drop trigger if exists trg_refresh_tokens_updated_at on refresh_tokens;
create trigger trg_refresh_tokens_updated_at before update on refresh_tokens
  for each row execute function fn_set_updated_at();
