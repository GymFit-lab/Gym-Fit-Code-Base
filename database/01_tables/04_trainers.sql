-- Trainers shown on the Trainers page. user_id links an optional staff login.
create table if not exists trainers (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references gyms (id),
  user_id     uuid,
  name        text not null check (length(btrim(name)) between 2 and 80),
  specialty   text not null check (length(btrim(specialty)) between 2 and 80),
  phone       text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email       citext check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  joined_on   date not null default current_date,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint uq_trainers_gym_id unique (gym_id, id),
  constraint fk_trainers_user foreign key (gym_id, user_id) references app_users (gym_id, id)
);

create index if not exists ix_trainers_gym_name on trainers (gym_id, name) where not is_deleted;
create unique index if not exists uq_trainers_gym_phone on trainers (gym_id, phone) where not is_deleted;

drop trigger if exists trg_trainers_updated_at on trainers;
create trigger trg_trainers_updated_at before update on trainers
  for each row execute function fn_set_updated_at();
