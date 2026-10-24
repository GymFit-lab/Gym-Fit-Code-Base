-- A client's paid period on a plan. end_date is inclusive (start + months - 1 day).
create table if not exists memberships (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references gyms (id),
  client_id   uuid not null,
  plan_id     uuid not null,
  start_date  date not null,
  end_date    date not null,
  amount      integer not null check (amount >= 0),
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint uq_memberships_gym_id unique (gym_id, id),
  constraint ck_memberships_dates check (end_date >= start_date),
  constraint fk_memberships_client foreign key (gym_id, client_id) references clients (gym_id, id),
  constraint fk_memberships_plan foreign key (gym_id, plan_id) references membership_plans (gym_id, id)
);

create index if not exists ix_memberships_gym_client_end
  on memberships (gym_id, client_id, end_date desc) where not is_deleted;
create index if not exists ix_memberships_gym_end on memberships (gym_id, end_date) where not is_deleted;
create index if not exists ix_memberships_gym_start
  on memberships (gym_id, start_date desc) where not is_deleted;
create index if not exists ix_memberships_gym_plan on memberships (gym_id, plan_id) where not is_deleted;

drop trigger if exists trg_memberships_updated_at on memberships;
create trigger trg_memberships_updated_at before update on memberships
  for each row execute function fn_set_updated_at();
