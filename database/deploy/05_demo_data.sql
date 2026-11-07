-- Optional demo data for one production gym, so the dashboard and every page look lived-in
-- while showing the product. Re-runnable: it only removes and re-inserts the rows it owns
-- (clients/trainers/plans identified by the fixed phone numbers/names below), never real data.
--
-- Run as fitva_owner after 03_first_gym.sql (the gym is found through its owner login):
--
--   psql -h 127.0.0.1 -U fitva_owner -d fitva_db -v ON_ERROR_STOP=1 \
--     -v owner_email='owner@example.in' -f database/deploy/05_demo_data.sql
--
-- No extra staff logins are created: the trainers below are records only (trainers.user_id is null).
\set ON_ERROR_STOP on
\if :{?owner_email}
\else
  \echo 'Missing -v owner_email=...'
  do $$ begin raise exception 'owner_email not set'; end $$;
\endif

begin;

create temp table _gym on commit drop as
select g.id as gym_id
from gyms g
join app_users u on u.gym_id = g.id
where u.email = lower(btrim(:'owner_email')) and u.role = 'owner' and not u.is_deleted
limit 1;

do $$
begin
  if not exists (select 1 from _gym) then
    raise exception 'No owner login found for that email';
  end if;
end;
$$;

-- 1. Remove the demo rows of this gym (children first). Real rows are never touched: every
--    statement is limited to the demo phones/plan names listed in the inserts below.
delete from attendance a
using clients c
where c.gym_id = (select gym_id from _gym) and a.gym_id = c.gym_id and a.client_id = c.id
  and c.phone in ('9822011201','9890122334','9765433210','9004567812','8805123456','9158765432',
                  '7020345678','9967123450','9819988776','8669012345','9372456789','7387654321');

delete from body_measurements b
using clients c
where c.gym_id = (select gym_id from _gym) and b.gym_id = c.gym_id and b.client_id = c.id
  and c.phone in ('9822011201','9890122334','9765433210','9004567812','8805123456','9158765432',
                  '7020345678','9967123450','9819988776','8669012345','9372456789','7387654321');

delete from payments p
using clients c
where c.gym_id = (select gym_id from _gym) and p.gym_id = c.gym_id and p.client_id = c.id
  and c.phone in ('9822011201','9890122334','9765433210','9004567812','8805123456','9158765432',
                  '7020345678','9967123450','9819988776','8669012345','9372456789','7387654321');

delete from memberships m
using clients c
where c.gym_id = (select gym_id from _gym) and m.gym_id = c.gym_id and m.client_id = c.id
  and c.phone in ('9822011201','9890122334','9765433210','9004567812','8805123456','9158765432',
                  '7020345678','9967123450','9819988776','8669012345','9372456789','7387654321');

delete from clients
where gym_id = (select gym_id from _gym)
  and phone in ('9822011201','9890122334','9765433210','9004567812','8805123456','9158765432',
                '7020345678','9967123450','9819988776','8669012345','9372456789','7387654321');

delete from membership_plans
where gym_id = (select gym_id from _gym)
  and lower(name) in ('monthly','quarterly','half-yearly','annual');

delete from trainers
where gym_id = (select gym_id from _gym)
  and phone in ('9822001002','9822001003','9822001005');

-- 2. Trainers (records only, no logins).
insert into trainers (gym_id, name, specialty, phone, email, joined_on)
select g.gym_id, v.name, v.specialty, v.phone, v.email, d.today - v.joined_ago
from (select gym_id from _gym) g
cross join lateral (select fn_gym_today(g.gym_id) as today) d
cross join (values
  ('Sneha Kulkarni', 'Strength & Conditioning', '9822001002', 'trainer@fitvademo.in',    400),
  ('Arjun Patil',    'Weight Loss & HIIT',      '9822001003', 'trainer2@fitvademo.in',   300),
  ('Vikram Shinde',  'Yoga & Mobility',         '9822001005', 'vikram.shinde@fitvademo.in', 200)
) as v (name, specialty, phone, email, joined_ago);

-- 3. Membership plans.
insert into membership_plans (gym_id, name, duration_months, price)
select gym_id, v.name, v.months, v.price from (select gym_id from _gym) g
cross join (values
  ('Monthly', 1, 1500),
  ('Quarterly', 3, 4000),
  ('Half-Yearly', 6, 7500),
  ('Annual', 12, 13000)
) as v (name, months, price);

-- 4. Clients (trainer_phone: null = no trainer).
insert into clients (gym_id, name, phone, email, gender, joined_on, trainer_id)
select g.gym_id, v.name, v.phone, v.email, v.gender, d.today - v.joined_ago,
       (select t.id from trainers t
        where t.gym_id = g.gym_id and t.phone = v.trainer_phone and not t.is_deleted)
from (select gym_id from _gym) g
cross join lateral (select fn_gym_today(g.gym_id) as today) d
cross join (values
  ('Aditya Pawar',    '9822011201', 'aditya.pawar@gmail.com',      'male',   300, '9822001002'),
  ('Neha Gokhale',    '9890122334', 'neha.gokhale@gmail.com',      'female',  95, '9822001003'),
  ('Omkar Jadhav',    '9765433210', null,                          'male',    70, '9822001002'),
  ('Kavya Iyer',      '9004567812', 'kavya.iyer@outlook.com',      'female',  45, '9822001005'),
  ('Siddharth More',  '8805123456', 'siddharth.more@gmail.com',    'male',    26, '9822001003'),
  ('Ananya Bhosale',  '9158765432', 'ananya.b@yahoo.in',           'female', 410, null),
  ('Rahul Chavan',    '7020345678', 'rahul.chavan@gmail.com',      'male',    10, '9822001002'),
  ('Pooja Nair',      '9967123450', 'pooja.nair@gmail.com',        'female',  40, '9822001005'),
  ('Karan Mehta',     '9819988776', null,                          'male',     2, null),
  ('Shruti Kale',     '8669012345', 'shruti.kale@gmail.com',       'female', 175, '9822001003'),
  ('Manish Gupta',    '9372456789', 'manish.gupta@rediffmail.com', 'male',    64, null),
  ('Isha Deshpande',  '7387654321', 'isha.deshpande@gmail.com',    'female',  30, '9822001005')
) as v (name, phone, email, gender, joined_ago, trainer_phone);

-- 5. Memberships: end = start + plan months - 1 day, amount = plan price.
--    Today this yields active (Aditya, Kavya, Rahul, Pooja, Shruti, Isha), due (Neha,
--    Siddharth), expired (Omkar, Ananya, Manish) and none (Karan); Aditya and Pooja renewed.
insert into memberships (gym_id, client_id, plan_id, start_date, end_date, amount)
select g.gym_id, c.id, p.id, d.today - v.start_ago,
       ((d.today - v.start_ago) + make_interval(months => p.duration_months))::date - 1,
       p.price
from (select gym_id from _gym) g
cross join lateral (select fn_gym_today(g.gym_id) as today) d
cross join (values
  ('9822011201', 'quarterly',    300),
  ('9822011201', 'annual',       205),
  ('9890122334', 'quarterly',     86),
  ('9765433210', 'monthly',       34),
  ('9004567812', 'half-yearly',   45),
  ('8805123456', 'monthly',       26),
  ('9158765432', 'annual',       410),
  ('7020345678', 'quarterly',     10),
  ('9967123450', 'monthly',       40),
  ('9967123450', 'monthly',        9),
  ('8669012345', 'half-yearly',  170),
  ('9372456789', 'monthly',       64),
  ('7387654321', 'annual',        30)
) as v (client_phone, plan_name, start_ago)
join clients c on c.gym_id = g.gym_id and c.phone = v.client_phone and not c.is_deleted
join membership_plans p on p.gym_id = g.gym_id and lower(p.name) = v.plan_name and not p.is_deleted;

-- 6. One payment per demo membership (a few left pending so the dashboard has something due).
insert into payments (gym_id, client_id, membership_id, amount, method, status, payment_date, note)
select m.gym_id, m.client_id, m.id, m.amount,
       (array['upi','card','cash','bank'])[1 + abs(hashtext(c.phone)) % 4],
       case when c.phone in ('8805123456','7020345678') then 'pending' else 'paid' end,
       m.start_date, p.name
from memberships m
join clients c on c.gym_id = m.gym_id and c.id = m.client_id
join membership_plans p on p.gym_id = m.gym_id and p.id = m.plan_id
where m.gym_id = (select gym_id from _gym) and not m.is_deleted
  and c.phone in ('9822011201','9890122334','9765433210','9004567812','8805123456','9158765432',
                  '7020345678','9967123450','9819988776','8669012345','9372456789','7387654321');

-- Extra payments not tied to a membership (also spread over the last ~6 months so the revenue
-- chart and this-month KPI are populated on any day of the month).
insert into payments (gym_id, client_id, amount, method, status, payment_date, note)
select g.gym_id, c.id, v.amount, v.method, v.status, d.today - v.days_ago, v.note
from (select gym_id from _gym) g
cross join lateral (select fn_gym_today(g.gym_id) as today) d
cross join (values
  ('9822011201',  2000, 'upi',  'paid',     2, 'Personal training - 4 sessions'),
  ('7387654321',   800, 'card', 'paid',     5, 'Diet consultation'),
  ('9004567812',   500, 'cash', 'pending',  3, 'Locker rent - 1 month'),
  ('9890122334',  9000, 'bank', 'paid',    40, 'Personal training package - 10 sessions'),
  ('8669012345',  7500, 'upi',  'paid',    70, 'Half-yearly renewal'),
  ('9822011201', 13000, 'card', 'paid',   100, 'Annual membership - card'),
  ('9967123450',  1500, 'cash', 'paid',   130, 'Monthly membership'),
  ('9372456789', 16000, 'bank', 'paid',   160, 'Personal training package')
) as v (client_phone, amount, method, status, days_ago, note)
join clients c on c.gym_id = g.gym_id and c.phone = v.client_phone and not c.is_deleted;

-- 7. Attendance for the last 30 days (~60% of days while the membership covered them),
--    deterministic via hashtext, one check-in per client per day, never in the future.
insert into attendance (gym_id, client_id, checked_in_at, check_in_date)
select c.gym_id, c.id,
       case when x.n = 0
         then greatest(
           (d.today + time '00:01') at time zone 'Asia/Kolkata',
           least(x.ts, now() - make_interval(mins => 5 + (abs(hashtext(c.id::text)) % 120))))
         else x.ts
       end,
       x.day
from (select gym_id from _gym) g
cross join lateral (select fn_gym_today(g.gym_id) as today) d
join clients c on c.gym_id = g.gym_id and not c.is_deleted
  and c.phone in ('9822011201','9890122334','9765433210','9004567812','8805123456','9158765432',
                  '7020345678','9967123450','9819988776','8669012345','9372456789','7387654321')
cross join generate_series(0, 29) as gs (n)
cross join lateral (
  select
    gs.n as n,
    d.today - gs.n as day,
    ((d.today - gs.n)
      + make_time(
          (array[6, 6, 7, 7, 8, 9, 17, 18, 18, 19, 20, 21])[1 + abs(hashtext(c.id::text || 'h' || gs.n)) % 12],
          abs(hashtext(c.id::text || 'm' || gs.n)) % 60,
          0)
    ) at time zone 'Asia/Kolkata' as ts
) x
where abs(hashtext(c.id::text || ':' || gs.n)) % 10 < 6
  and exists (
    select 1 from memberships m
    where m.gym_id = c.gym_id and m.client_id = c.id and not m.is_deleted
      and x.day between m.start_date and m.end_date
  );

-- 8. Body measurements (two clients, before/after).
insert into body_measurements (
  gym_id, client_id, measured_on, weight_kg, height_cm, body_fat_pct,
  chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes
)
select g.gym_id, c.id, d.today - v.days_ago, v.w, v.h, v.bf, v.chest, v.waist, v.hips, v.arm, v.thigh, v.notes
from (select gym_id from _gym) g
cross join lateral (select fn_gym_today(g.gym_id) as today) d
cross join (values
  ('9822011201', 90, 84.5, 176.0, 24.0, 102.0, 92.0, 100.0, 35.0, 58.0, 'Baseline at start of Annual plan'),
  ('9822011201',  6, 79.8, 176.0, 20.5, 101.0, 86.0,  97.0, 36.5, 57.0, 'Down 4.7 kg; waist -6 cm'),
  ('9004567812', 44, 62.0, 162.0, 28.5,  88.0, 74.0,  96.0, 27.0, 54.0, 'Baseline'),
  ('9004567812',  4, 60.6, 162.0, 27.0,  87.5, 71.5,  95.0, 27.0, 53.5, 'Good progress on mobility work')
) as v (client_phone, days_ago, w, h, bf, chest, waist, hips, arm, thigh, notes)
join clients c on c.gym_id = g.gym_id and c.phone = v.client_phone and not c.is_deleted;

commit;

\echo '== done: demo data added to the gym owned by' :owner_email
