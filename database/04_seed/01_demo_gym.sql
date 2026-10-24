-- Demo data for "FITVA Demo Gym". Idempotent: removes the demo gym's rows, then inserts them again.
-- All dates are relative to the gym-local today, so the dashboard always looks current.
-- Passwords are bcrypt via pgcrypto (crypt + gen_salt('bf', 10)) -> "$2a$10$..." hashes, which
-- bcrypt/bcryptjs compare() and usp_user_verify_password both accept.
--
-- Fixed ids (so the API/tests can refer to them):
--   gym      0f17a000-0000-4000-a000-000000000001
--   users    0f17a000-0001-4000-a000-0000000000NN
--   trainers 0f17a000-0002-4000-a000-0000000000NN
--   plans    0f17a000-0003-4000-a000-0000000000NN
--   clients  0f17a000-0004-4000-a000-0000000000NN
--   members. 0f17a000-0005-4000-a000-0000000000NN

-- 1. Clear the demo gym (children first).
delete from refresh_tokens    where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from attendance        where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from body_measurements where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from payments          where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from memberships       where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from clients           where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from membership_plans  where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from trainers          where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from app_users         where gym_id = '0f17a000-0000-4000-a000-000000000001';
delete from gyms              where id     = '0f17a000-0000-4000-a000-000000000001';

-- 2. Gym.
insert into gyms (id, name, branch, timezone, currency)
values ('0f17a000-0000-4000-a000-000000000001', 'FITVA Demo Gym', 'Kothrud, Pune', 'Asia/Kolkata', 'INR');

-- 3. Staff logins: 1 owner, 2 trainers, 1 front desk.
insert into app_users (id, gym_id, name, email, phone, password_hash, role)
values
  ('0f17a000-0001-4000-a000-000000000001', '0f17a000-0000-4000-a000-000000000001',
   'Rohan Deshmukh', 'owner@fitvademo.in', '9822001001', crypt('Owner@123', gen_salt('bf', 10)), 'owner'),
  ('0f17a000-0001-4000-a000-000000000002', '0f17a000-0000-4000-a000-000000000001',
   'Sneha Kulkarni', 'trainer@fitvademo.in', '9822001002', crypt('Trainer@123', gen_salt('bf', 10)), 'trainer'),
  ('0f17a000-0001-4000-a000-000000000003', '0f17a000-0000-4000-a000-000000000001',
   'Arjun Patil', 'trainer2@fitvademo.in', '9822001003', crypt('Trainer@123', gen_salt('bf', 10)), 'trainer'),
  ('0f17a000-0001-4000-a000-000000000004', '0f17a000-0000-4000-a000-000000000001',
   'Priya Joshi', 'frontdesk@fitvademo.in', '9822001004', crypt('Desk@123', gen_salt('bf', 10)), 'front_desk');

-- 4. Trainers (two linked to their logins, one without a login).
insert into trainers (id, gym_id, user_id, name, specialty, phone, email, joined_on)
select v.id::uuid, '0f17a000-0000-4000-a000-000000000001'::uuid, v.user_id::uuid, v.name, v.specialty,
       v.phone, v.email, d.today - v.joined_ago
from (select fn_gym_today('0f17a000-0000-4000-a000-000000000001') as today) d
cross join (values
  ('0f17a000-0002-4000-a000-000000000001', '0f17a000-0001-4000-a000-000000000002',
   'Sneha Kulkarni', 'Strength & Conditioning', '9822001002', 'trainer@fitvademo.in', 400),
  ('0f17a000-0002-4000-a000-000000000002', '0f17a000-0001-4000-a000-000000000003',
   'Arjun Patil', 'Weight Loss & HIIT', '9822001003', 'trainer2@fitvademo.in', 300),
  ('0f17a000-0002-4000-a000-000000000003', null,
   'Vikram Shinde', 'Yoga & Mobility', '9822001005', 'vikram.shinde@fitvademo.in', 200)
) as v (id, user_id, name, specialty, phone, email, joined_ago);

-- 5. Membership plans.
insert into membership_plans (id, gym_id, name, duration_months, price)
values
  ('0f17a000-0003-4000-a000-000000000001', '0f17a000-0000-4000-a000-000000000001', 'Monthly', 1, 1500),
  ('0f17a000-0003-4000-a000-000000000002', '0f17a000-0000-4000-a000-000000000001', 'Quarterly', 3, 4000),
  ('0f17a000-0003-4000-a000-000000000003', '0f17a000-0000-4000-a000-000000000001', 'Half-Yearly', 6, 7500),
  ('0f17a000-0003-4000-a000-000000000004', '0f17a000-0000-4000-a000-000000000001', 'Annual', 12, 13000);

-- 6. Clients (trainer suffix: 1 Sneha, 2 Arjun, 3 Vikram, null = no trainer).
insert into clients (id, gym_id, name, phone, email, gender, joined_on, trainer_id)
select ('0f17a000-0004-4000-a000-0000000000' || v.n)::uuid, '0f17a000-0000-4000-a000-000000000001'::uuid,
       v.name, v.phone, v.email, v.gender, d.today - v.joined_ago,
       ('0f17a000-0002-4000-a000-00000000000' || v.trainer)::uuid
from (select fn_gym_today('0f17a000-0000-4000-a000-000000000001') as today) d
cross join (values
  ('01', 'Aditya Pawar',     '9822011201', 'aditya.pawar@gmail.com',      'male',   300, '1'),
  ('02', 'Neha Gokhale',     '9890122334', 'neha.gokhale@gmail.com',      'female',  95, '2'),
  ('03', 'Omkar Jadhav',     '9765433210', null,                          'male',    70, '1'),
  ('04', 'Kavya Iyer',       '9004567812', 'kavya.iyer@outlook.com',      'female',  45, '3'),
  ('05', 'Siddharth More',   '8805123456', 'siddharth.more@gmail.com',    'male',    26, '2'),
  ('06', 'Ananya Bhosale',   '9158765432', 'ananya.b@yahoo.in',           'female', 410, null),
  ('07', 'Rahul Chavan',     '7020345678', 'rahul.chavan@gmail.com',      'male',    10, '1'),
  ('08', 'Pooja Nair',       '9967123450', 'pooja.nair@gmail.com',        'female',  40, '3'),
  ('09', 'Karan Mehta',      '9819988776', null,                          'male',     2, null),
  ('10', 'Shruti Kale',      '8669012345', 'shruti.kale@gmail.com',       'female', 175, '2'),
  ('11', 'Manish Gupta',     '9372456789', 'manish.gupta@rediffmail.com', 'male',    64, null),
  ('12', 'Isha Deshpande',   '7387654321', 'isha.deshpande@gmail.com',    'female',  30, '3')
) as v (n, name, phone, email, gender, joined_ago, trainer);

-- 7. Memberships: end = start + plan months - 1 day, amount = plan price.
--    Resulting status today: active (01, 04, 07, 08, 10, 12), due (02, 05), expired (03 overdue,
--    06, 11), none (09). Aditya and Pooja renewed (history rows m01, m09).
insert into memberships (id, gym_id, client_id, plan_id, start_date, end_date, amount)
select ('0f17a000-0005-4000-a000-0000000000' || v.m)::uuid, p.gym_id,
       ('0f17a000-0004-4000-a000-0000000000' || v.c)::uuid, p.id,
       d.today - v.start_ago,
       ((d.today - v.start_ago) + make_interval(months => p.duration_months))::date - 1,
       p.price
from (select fn_gym_today('0f17a000-0000-4000-a000-000000000001') as today) d
cross join (values
  ('01', '01', '2', 300),  -- Aditya: old Quarterly
  ('02', '01', '4', 205),  -- Aditya: renewed to Annual
  ('03', '02', '2',  86),  -- Neha: Quarterly, ends in ~4 days (due)
  ('04', '03', '1',  34),  -- Omkar: Monthly, ended a few days ago (overdue)
  ('05', '04', '3',  45),  -- Kavya: Half-Yearly
  ('06', '05', '1',  26),  -- Siddharth: Monthly, ends in ~4 days (due)
  ('07', '06', '4', 410),  -- Ananya: Annual, expired over a month ago
  ('08', '07', '2',  10),  -- Rahul: Quarterly, just joined
  ('09', '08', '1',  40),  -- Pooja: previous Monthly
  ('10', '08', '1',   9),  -- Pooja: renewed Monthly
  ('11', '10', '3', 170),  -- Shruti: Half-Yearly, ends in ~2 weeks
  ('12', '11', '1',  64),  -- Manish: Monthly, expired, not renewed
  ('13', '12', '4',  30)   -- Isha: Annual
) as v (m, c, plan, start_ago)
join membership_plans p on p.id = ('0f17a000-0003-4000-a000-00000000000' || v.plan)::uuid;

-- 8. Payments: one per membership (dated on its start date, note = plan name) ...
insert into payments (gym_id, client_id, membership_id, amount, method, status, payment_date, note)
select m.gym_id, m.client_id, m.id, m.amount, v.method, v.status, m.start_date, p.name
from (values
  ('01', 'upi',  'paid'),
  ('02', 'card', 'paid'),
  ('03', 'upi',  'paid'),
  ('04', 'cash', 'paid'),
  ('05', 'bank', 'paid'),
  ('06', 'cash', 'pending'),
  ('07', 'card', 'paid'),
  ('08', 'upi',  'pending'),
  ('09', 'upi',  'paid'),
  ('10', 'upi',  'paid'),
  ('11', 'cash', 'paid'),
  ('12', 'cash', 'paid'),
  ('13', 'bank', 'paid')
) as v (m, method, status)
join memberships m on m.id = ('0f17a000-0005-4000-a000-0000000000' || v.m)::uuid
join membership_plans p on p.gym_id = m.gym_id and p.id = m.plan_id;

-- ... plus a few extras not tied to a membership.
insert into payments (gym_id, client_id, amount, method, status, payment_date, note)
select '0f17a000-0000-4000-a000-000000000001'::uuid, ('0f17a000-0004-4000-a000-0000000000' || v.c)::uuid,
       v.amount, v.method, v.status, d.today - v.days_ago, v.note
from (select fn_gym_today('0f17a000-0000-4000-a000-000000000001') as today) d
cross join (values
  ('01', 2000, 'upi',  'paid',    12, 'Personal training - 4 sessions'),
  ('12',  800, 'card', 'paid',    20, 'Diet consultation'),
  ('04',  500, 'cash', 'pending',  3, 'Locker rent - 1 month')
) as v (c, amount, method, status, days_ago, note);

-- 9. Attendance for the last 30 days: ~60% of days for each client whose membership covered that
--    day, at typical gym hours (IST). Deterministic (hashtext), one check-in per client per day.
--    Today's check-ins are pulled back to before "now" so none are in the future.
insert into attendance (gym_id, client_id, checked_in_at, check_in_date)
select c.gym_id, c.id,
       case when x.n = 0
         then greatest(
           (d.today + time '00:01') at time zone 'Asia/Kolkata',
           least(x.ts, now() - make_interval(mins => 5 + (abs(hashtext(c.id::text)) % 120))))
         else x.ts
       end,
       x.day
from (select fn_gym_today('0f17a000-0000-4000-a000-000000000001') as today) d
join clients c on c.gym_id = '0f17a000-0000-4000-a000-000000000001'
cross join generate_series(0, 29) as g (n)
cross join lateral (
  select
    g.n as n,
    d.today - g.n as day,
    ((d.today - g.n)
      + make_time(
          (array[6, 6, 7, 7, 8, 9, 17, 18, 18, 19, 20, 21])[1 + abs(hashtext(c.id::text || 'h' || g.n)) % 12],
          abs(hashtext(c.id::text || 'm' || g.n)) % 60,
          0)
    ) at time zone 'Asia/Kolkata' as ts
) x
where abs(hashtext(c.id::text || ':' || g.n)) % 10 < 6
  and exists (
    select 1 from memberships m
    where m.gym_id = c.gym_id and m.client_id = c.id and not m.is_deleted
      and x.day between m.start_date and m.end_date
  );

-- 10. Body measurements (two clients, before/after).
insert into body_measurements (
  gym_id, client_id, measured_on, weight_kg, height_cm, body_fat_pct,
  chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes
)
select '0f17a000-0000-4000-a000-000000000001'::uuid, ('0f17a000-0004-4000-a000-0000000000' || v.c)::uuid,
       d.today - v.days_ago, v.w, v.h, v.bf, v.chest, v.waist, v.hips, v.arm, v.thigh, v.notes
from (select fn_gym_today('0f17a000-0000-4000-a000-000000000001') as today) d
cross join (values
  ('01', 90, 84.5, 176.0, 24.0, 102.0, 92.0, 100.0, 35.0, 58.0, 'Baseline at start of Annual plan'),
  ('01',  6, 79.8, 176.0, 20.5, 101.0, 86.0,  97.0, 36.5, 57.0, 'Down 4.7 kg; waist -6 cm'),
  ('04', 44, 62.0, 162.0, 28.5,  88.0, 74.0,  96.0, 27.0, 54.0, 'Baseline'),
  ('04',  4, 60.6, 162.0, 27.0,  87.5, 71.5,  95.0, 27.0, 53.5, 'Good progress on mobility work')
) as v (c, days_ago, w, h, bf, chest, waist, hips, arm, thigh, notes);

-- ---------------------------------------------------------------------------------------------
-- DEMO LOGINS (email / password)
--   Owner       owner@fitvademo.in       Owner@123
--   Trainer     trainer@fitvademo.in     Trainer@123   (Sneha Kulkarni)
--   Trainer     trainer2@fitvademo.in    Trainer@123   (Arjun Patil)
--   Front desk  frontdesk@fitvademo.in   Desk@123      (Priya Joshi)
-- Demo gym id: 0f17a000-0000-4000-a000-000000000001
-- ---------------------------------------------------------------------------------------------
