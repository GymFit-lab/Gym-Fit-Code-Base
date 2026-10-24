-- Progress measurements. No screen uses these yet (DB_CONTRACT.md Q4); kept for the progress feature.
create table if not exists body_measurements (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references gyms (id),
  client_id     uuid not null,
  measured_on   date not null,
  weight_kg     numeric(5, 2) check (weight_kg > 0 and weight_kg < 400),
  height_cm     numeric(5, 1) check (height_cm > 0 and height_cm < 260),
  body_fat_pct  numeric(4, 1) check (body_fat_pct >= 0 and body_fat_pct <= 75),
  chest_cm      numeric(5, 1) check (chest_cm > 0),
  waist_cm      numeric(5, 1) check (waist_cm > 0),
  hips_cm       numeric(5, 1) check (hips_cm > 0),
  arm_cm        numeric(5, 1) check (arm_cm > 0),
  thigh_cm      numeric(5, 1) check (thigh_cm > 0),
  notes         text not null default '' check (length(notes) <= 500),
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint fk_body_measurements_client
    foreign key (gym_id, client_id) references clients (gym_id, id)
);

create unique index if not exists uq_body_measurements_client_day
  on body_measurements (gym_id, client_id, measured_on) where not is_deleted;
create index if not exists ix_body_measurements_gym_client
  on body_measurements (gym_id, client_id, measured_on desc) where not is_deleted;

drop trigger if exists trg_body_measurements_updated_at on body_measurements;
create trigger trg_body_measurements_updated_at before update on body_measurements
  for each row execute function fn_set_updated_at();
