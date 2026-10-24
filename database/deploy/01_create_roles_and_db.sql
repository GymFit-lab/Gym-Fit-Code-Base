-- Step 1 of a production database: two logins and the database. Run ONCE as the postgres
-- superuser, connected to the "postgres" database:
--
--   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d postgres `
--       -v owner_password='<strong password 1>' -v app_password='<strong password 2>' `
--       -f database/deploy/01_create_roles_and_db.sql
--
-- fitva_owner  owns the database and its objects; used only to apply run_prod.sql (deploys/updates).
-- fitva_app    what the API connects as; gets only the rights in 02_grants.sql (no DDL, no DELETE).
-- Optional: -v db_name=… -v owner_role=… -v app_role=… (the defaults below). Re-running is safe:
-- existing roles just get the new passwords.
\set ON_ERROR_STOP on
\if :{?db_name}
\else
  \set db_name fitva_db
\endif
\if :{?owner_role}
\else
  \set owner_role fitva_owner
\endif
\if :{?app_role}
\else
  \set app_role fitva_app
\endif
\if :{?owner_password}
\else
  \echo 'Missing -v owner_password=...'
  do $$ begin raise exception 'owner_password not set'; end $$;
\endif
\if :{?app_password}
\else
  \echo 'Missing -v app_password=...'
  do $$ begin raise exception 'app_password not set'; end $$;
\endif

-- Roles (create, or reset the password if they already exist).
select format('create role %I login password %L', :'owner_role', :'owner_password')
where not exists (select 1 from pg_roles where rolname = :'owner_role') \gexec
select format('alter role %I login password %L', :'owner_role', :'owner_password')
where exists (select 1 from pg_roles where rolname = :'owner_role') \gexec
select format('create role %I login password %L', :'app_role', :'app_password')
where not exists (select 1 from pg_roles where rolname = :'app_role') \gexec
select format('alter role %I login password %L', :'app_role', :'app_password')
where exists (select 1 from pg_roles where rolname = :'app_role') \gexec

-- Database owned by fitva_owner (so it owns schema public and can create the trusted extensions
-- pgcrypto and citext). Nobody else may connect.
select format('create database %I owner %I encoding %L template template0', :'db_name', :'owner_role', 'UTF8')
where not exists (select 1 from pg_database where datname = :'db_name') \gexec
select format('revoke all on database %I from public', :'db_name') \gexec
select format('grant connect on database %I to %I', :'db_name', :'app_role') \gexec

\echo '== done: roles and database ready. Next: run_prod.sql as' :owner_role
