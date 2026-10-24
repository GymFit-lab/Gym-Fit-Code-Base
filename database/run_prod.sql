-- Applies the FITVA database for PRODUCTION: extensions, tables, views, functions — no demo seed.
-- Same file list as run_all.sql minus 04_seed (keep the two in sync when adding files).
-- One transaction: any error rolls everything back. Re-runnable (also used for updates).
-- Run as the database owner (see database/deploy/01_create_roles_and_db.sql):
--   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U fitva_owner -d fitva_db -f database/run_prod.sql
-- then re-apply the app grants: database/deploy/02_grants.sql
\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;

begin;

\echo '== extensions'
\ir 00_extensions.sql

\echo '== tables'
\ir 01_tables/00_common.sql
\ir 01_tables/01_gyms.sql
\ir 01_tables/02_app_users.sql
\ir 01_tables/03_refresh_tokens.sql
\ir 01_tables/04_trainers.sql
\ir 01_tables/05_membership_plans.sql
\ir 01_tables/06_clients.sql
\ir 01_tables/07_memberships.sql
\ir 01_tables/08_payments.sql
\ir 01_tables/09_attendance.sql
\ir 01_tables/10_body_measurements.sql

\echo '== views'
\ir 02_views/00_helpers.sql
\ir 02_views/01_v_client_current_membership.sql
\ir 02_views/02_v_active_members.sql

\echo '== functions'
\ir 03_functions/usp_attendance_check_in.sql
\ir 03_functions/usp_attendance_get_daily.sql
\ir 03_functions/usp_attendance_get_list.sql
\ir 03_functions/usp_attendance_get_paged.sql
\ir 03_functions/usp_attendance_get_peak_hour.sql
\ir 03_functions/usp_body_measurement_get_by_client.sql
\ir 03_functions/usp_body_measurement_save.sql
\ir 03_functions/usp_client_delete.sql
\ir 03_functions/usp_client_get_by_id.sql
\ir 03_functions/usp_client_get_counts.sql
\ir 03_functions/usp_client_get_paged.sql
\ir 03_functions/usp_client_save.sql
\ir 03_functions/usp_dashboard_get_kpis.sql
\ir 03_functions/usp_dashboard_get_members_by_plan.sql
\ir 03_functions/usp_dashboard_get_pending_payments.sql
\ir 03_functions/usp_dashboard_get_recent_checkins.sql
\ir 03_functions/usp_dashboard_get_renewals.sql
\ir 03_functions/usp_dashboard_get_revenue_by_month.sql
\ir 03_functions/usp_dashboard_get_trainer_load.sql
\ir 03_functions/usp_gym_get.sql
\ir 03_functions/usp_membership_create.sql
\ir 03_functions/usp_membership_get_paged.sql
\ir 03_functions/usp_payment_get_export.sql
\ir 03_functions/usp_payment_get_paged.sql
\ir 03_functions/usp_payment_get_totals.sql
\ir 03_functions/usp_payment_mark_paid.sql
\ir 03_functions/usp_payment_save.sql
\ir 03_functions/usp_plan_get_list.sql
\ir 03_functions/usp_plan_save.sql
\ir 03_functions/usp_refresh_token_get.sql
\ir 03_functions/usp_refresh_token_revoke.sql
\ir 03_functions/usp_refresh_token_save.sql
\ir 03_functions/usp_report_get_paid_by_method.sql
\ir 03_functions/usp_report_get_renewals.sql
\ir 03_functions/usp_report_get_summary.sql
\ir 03_functions/usp_trainer_get_paged.sql
\ir 03_functions/usp_trainer_save.sql
\ir 03_functions/usp_user_get_by_email.sql
\ir 03_functions/usp_user_get_by_id.sql
\ir 03_functions/usp_user_get_list.sql
\ir 03_functions/usp_user_save.sql
\ir 03_functions/usp_user_set_active.sql
\ir 03_functions/usp_user_set_password.sql
\ir 03_functions/usp_user_touch_login.sql
\ir 03_functions/usp_user_verify_password.sql

commit;

\echo '== done: FITVA database applied (no demo data)'
