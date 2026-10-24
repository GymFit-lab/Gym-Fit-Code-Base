-- Membership plans (Monthly, Quarterly, ...). price in whole rupees.
create table if not exists membership_plans (
  id               uuid primary key default gen_random_uuid(),
  gym_id           uuid not null references gyms (id),
  name             text not null check (length(btrim(name)) between 2 and 40),
  duration_months  integer not null check (duration_months between 1 and 36),
  price            integer not null check (price >= 1),
  is_deleted       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_membership_plans_gym_id unique (gym_id, id)
);

create unique index if not exists uq_membership_plans_gym_name
  on membership_plans (gym_id, lower(name)) where not is_deleted;

drop trigger if exists trg_membership_plans_updated_at on membership_plans;
create trigger trg_membership_plans_updated_at before update on membership_plans
  for each row execute function fn_set_updated_at();
