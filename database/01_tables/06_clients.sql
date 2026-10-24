-- Gym members. Status is derived from memberships (v_client_current_membership), never stored.
create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references gyms (id),
  name        text not null check (length(btrim(name)) between 2 and 80),
  phone       text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email       citext check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  gender      text not null check (gender in ('male', 'female', 'other')),
  joined_on   date not null default current_date,
  trainer_id  uuid,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint uq_clients_gym_id unique (gym_id, id),
  constraint fk_clients_trainer foreign key (gym_id, trainer_id) references trainers (gym_id, id)
);

create unique index if not exists uq_clients_gym_phone on clients (gym_id, phone) where not is_deleted;
create unique index if not exists uq_clients_gym_email
  on clients (gym_id, email) where email is not null and not is_deleted;
create index if not exists ix_clients_gym_name on clients (gym_id, name) where not is_deleted;
create index if not exists ix_clients_gym_trainer on clients (gym_id, trainer_id) where not is_deleted;
create index if not exists ix_clients_gym_joined on clients (gym_id, joined_on) where not is_deleted;

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at before update on clients
  for each row execute function fn_set_updated_at();
