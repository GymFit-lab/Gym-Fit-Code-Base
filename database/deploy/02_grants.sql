-- Step 3: the API login's rights. Run as fitva_owner after every run_prod.sql (it recreates the
-- functions, and this re-grants them):
--
--   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U fitva_owner -d fitva_db -f database/deploy/02_grants.sql
--
-- fitva_app may read/insert/update rows and execute the functions. No DELETE (the app only
-- soft-deletes), no CREATE/ALTER/DROP. Optional: -v app_role=… (default fitva_app).
\set ON_ERROR_STOP on
\if :{?app_role}
\else
  \set app_role fitva_app
\endif

select format('grant usage on schema public to %I', :'app_role') \gexec
select format('grant select, insert, update on all tables in schema public to %I', :'app_role') \gexec
select format('grant usage, select on all sequences in schema public to %I', :'app_role') \gexec
-- Only FITVA's own functions: the pgcrypto/citext ones belong to the superuser and are already
-- executable by everyone (granting on them would only print warnings).
select format('grant execute on function %s to %I', p.oid::regprocedure, :'app_role')
from pg_proc p
where p.pronamespace = 'public'::regnamespace and p.proowner = current_user::regrole \gexec

-- Objects fitva_owner creates later get the same rights automatically.
select format('alter default privileges in schema public grant select, insert, update on tables to %I', :'app_role') \gexec
select format('alter default privileges in schema public grant usage, select on sequences to %I', :'app_role') \gexec
select format('alter default privileges in schema public grant execute on functions to %I', :'app_role') \gexec

\echo '== done: grants applied to' :app_role
