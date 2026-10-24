-- One row per live client with the membership that ends last (lib/gym/selectors.ts
-- currentMembership) and the derived status: none / active / due / expired.
drop view if exists v_client_current_membership cascade;

create view v_client_current_membership as
select
  c.gym_id,
  c.id                                       as client_id,
  c.name,
  c.phone,
  c.email,
  c.gender,
  c.joined_on,
  c.trainer_id,
  t.name                                     as trainer_name,
  m.id                                       as membership_id,
  m.plan_id,
  p.name                                     as plan_name,
  m.start_date,
  m.end_date,
  m.amount,
  d.today,
  m.end_date - d.today                       as days_left,
  fn_membership_status(m.end_date, d.today)  as status,
  c.created_at
from clients c
join gyms g on g.id = c.gym_id
cross join lateral (select (now() at time zone g.timezone)::date as today) d
left join trainers t
  on t.gym_id = c.gym_id and t.id = c.trainer_id and not t.is_deleted
left join lateral (
  select mm.id, mm.gym_id, mm.plan_id, mm.start_date, mm.end_date, mm.amount
  from memberships mm
  where mm.gym_id = c.gym_id and mm.client_id = c.id and not mm.is_deleted
  order by mm.end_date desc, mm.start_date desc, mm.created_at desc
  limit 1
) m on true
left join membership_plans p on p.gym_id = m.gym_id and p.id = m.plan_id
where not c.is_deleted;
