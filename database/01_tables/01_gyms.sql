-- Tenant root. timezone decides "today" for every status, KPI and check-in.
create table if not exists gyms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) between 2 and 120),
  branch      text not null default '',
  timezone    text not null default 'Asia/Kolkata',
  currency    char(3) not null default 'INR',
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_gyms_updated_at on gyms;
create trigger trg_gyms_updated_at before update on gyms
  for each row execute function fn_set_updated_at();
