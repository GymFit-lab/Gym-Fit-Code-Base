-- Payments. payment_date = date received (paid) or date due (pending).
create table if not exists payments (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references gyms (id),
  client_id      uuid not null,
  membership_id  uuid,
  amount         integer not null check (amount >= 1),
  method         text not null check (method in ('cash', 'upi', 'card', 'bank')),
  status         text not null check (status in ('paid', 'pending')),
  payment_date   date not null,
  note           text not null default '' check (length(note) <= 120),
  is_deleted     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint fk_payments_client foreign key (gym_id, client_id) references clients (gym_id, id),
  constraint fk_payments_membership
    foreign key (gym_id, membership_id) references memberships (gym_id, id)
);

create index if not exists ix_payments_gym_date on payments (gym_id, payment_date desc) where not is_deleted;
create index if not exists ix_payments_gym_status_date
  on payments (gym_id, status, payment_date) where not is_deleted;
create index if not exists ix_payments_gym_client on payments (gym_id, client_id) where not is_deleted;

drop trigger if exists trg_payments_updated_at on payments;
create trigger trg_payments_updated_at before update on payments
  for each row execute function fn_set_updated_at();
