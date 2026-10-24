-- Adds a staff login (trainer / front desk / another owner) to an existing gym — until the API has
-- a staff-management endpoint. Run as fitva_owner:
--
--   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U fitva_owner -d fitva_db `
--       -v gym_id='<id printed by 03_first_gym.sql>' -v role='front_desk' `
--       -v name='Full Name' -v email='desk@example.in' -v password='<strong password>' `
--       -f database/deploy/04_add_staff_login.sql
--
-- role: owner | trainer | front_desk. A trainer login is separate from the trainers list
-- (POST /trainers); link them later via trainers.user_id if needed.
\set ON_ERROR_STOP on

insert into app_users (gym_id, name, email, password_hash, role)
values (:'gym_id'::uuid, btrim(:'name'), lower(btrim(:'email')), crypt(:'password', gen_salt('bf', 10)), :'role')
returning gym_id, id as user_id, email, role;
