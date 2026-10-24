-- Staff logins (owner / trainer / front desk). Email is unique across all gyms because login
-- happens before the gym is known. password_hash is bcrypt ($2a$, pgcrypto crypt/gen_salt('bf')).
create table if not exists app_users (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references gyms (id),
  name           text not null check (length(btrim(name)) between 2 and 80),
  email          citext not null check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone          text check (phone ~ '^[6-9][0-9]{9}$'),
  password_hash  text,
  role           text not null check (role in ('owner', 'trainer', 'front_desk')),
  is_active      boolean not null default true,
  last_login_at  timestamptz,
  is_deleted     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint uq_app_users_gym_id unique (gym_id, id)
);

create unique index if not exists uq_app_users_email on app_users (email) where not is_deleted;
create index if not exists ix_app_users_gym_role on app_users (gym_id, role) where not is_deleted;

drop trigger if exists trg_app_users_updated_at on app_users;
create trigger trg_app_users_updated_at before update on app_users
  for each row execute function fn_set_updated_at();
