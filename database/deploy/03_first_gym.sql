-- Step 4: the first real gym and its owner login (a production database has no demo data, and the
-- API has no sign-up). Run as fitva_owner:
--
--   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U fitva_owner -d fitva_db `
--       -v gym_name='Iron Temple Gym' -v gym_branch='Baner, Pune' `
--       -v owner_name='Full Name' -v owner_email='owner@example.in' -v owner_password='<strong password>' `
--       -f database/deploy/03_first_gym.sql
--
-- The password is bcrypt-hashed in the database ($2a$, as the seed); the owner logs in with it via
-- POST /auth/login. Prints the new gym id (needed by 04_add_staff_login.sql).
\set ON_ERROR_STOP on
\if :{?gym_branch}
\else
  \set gym_branch ''
\endif

begin;

with g as (
  insert into gyms (name, branch) values (btrim(:'gym_name'), btrim(:'gym_branch'))
  returning id
)
insert into app_users (gym_id, name, email, password_hash, role)
select g.id, btrim(:'owner_name'), lower(btrim(:'owner_email')), crypt(:'owner_password', gen_salt('bf', 10)), 'owner'
from g
returning gym_id, id as user_id, email, role;

commit;
