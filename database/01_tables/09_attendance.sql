-- Check-ins. check_in_date is the gym-local day (filled by trigger from gyms.timezone);
-- uq_attendance_client_day blocks a second check-in on the same day (SQLSTATE 23505).
create table if not exists attendance (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references gyms (id),
  client_id      uuid not null,
  checked_in_at  timestamptz not null default now(),
  check_in_date  date not null,
  is_deleted     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint fk_attendance_client foreign key (gym_id, client_id) references clients (gym_id, id)
);

create unique index if not exists uq_attendance_client_day
  on attendance (gym_id, client_id, check_in_date) where not is_deleted;
create index if not exists ix_attendance_gym_date on attendance (gym_id, check_in_date) where not is_deleted;
create index if not exists ix_attendance_gym_checked_in
  on attendance (gym_id, checked_in_at desc) where not is_deleted;

create or replace function fn_attendance_fill_date() returns trigger
language plpgsql as $$
begin
  if new.check_in_date is null or tg_op = 'UPDATE' then
    select (new.checked_in_at at time zone g.timezone)::date into new.check_in_date
    from gyms g where g.id = new.gym_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_attendance_fill_date on attendance;
create trigger trg_attendance_fill_date before insert or update of checked_in_at on attendance
  for each row execute function fn_attendance_fill_date();

drop trigger if exists trg_attendance_updated_at on attendance;
create trigger trg_attendance_updated_at before update on attendance
  for each row execute function fn_set_updated_at();
