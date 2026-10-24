# FITVA — Database Contract

Target: PostgreSQL 16, database `fitva_db` on `localhost:5432`, schema `public`.
Apply: `& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d fitva_db -f database/run_all.sql`

Status: **confirmed with defaults (2026-10-20).** The function names and signatures below are the
contract the NestJS repositories must call.

## 0. Where this contract comes from

No NestJS code existed to extract from. `backend/` only holds `ANALYSIS.md`, and
`D:\GymFit\backend` is an Express + MongoDB API with no stored functions. So the contract was
derived from:

1. `lib/gym/types.ts` and `lib/dashboard/types.ts`, the documented UI ↔ backend contract.
2. `lib/schemas/gym.ts` (validation limits), `lib/gym/selectors.ts` (status rules) and the views' derivations.
3. `backend/ANALYSIS.md` §3–4 (entities and the planned REST endpoints).
4. `D:\GymFit\backend` for the auth algorithm only (bcrypt).

Decisions taken (the defaults):
- Login emails are unique **across all gyms**.
- Roles are `owner / trainer / front_desk`.
- `body_measurements` is built and seeded.
- Only clients get delete. Every `_save` is an upsert.
- No `/gym-data` bootstrap functions.
- `fitva_db` is a separate database from Prisma/Better Auth, and the tables live in `public`.

## 1. Conventions

- ids are `uuid` (`gen_random_uuid()`) and the API returns them as strings. Money is `integer` whole rupees. Dates are `date` and timestamps are `timestamptz`.
- Every tenant table has `gym_id`, `is_deleted`, `created_at` and `updated_at` (kept by trigger). Reads filter `is_deleted = false`.
- **"Today" = gym-local date** (`fn_gym_today(gym_id)`, from `gyms.timezone`, default `Asia/Kolkata`). The API never passes "today" in.
- Functions are named `usp_<entity>_<action>` and take `p_gym_id uuid` first. Only the gym-less lookups are exempt: `usp_user_get_by_email`, `usp_user_verify_password` and `usp_refresh_token_get`. Reads are `LANGUAGE sql STABLE`, writes are `plpgsql`.
- **Paged functions** take `(p_gym_id, p_search, p_page, p_page_size, …filters default null)`. `p_page` is 1-based and the page size is clamped to 1–500 (default 20). Each row carries `total_count bigint`. Search is a case-insensitive substring match, with `%`/`_` escaped.
- Filters: `null`, `''` and `'all'` all mean "no filter".
- `usp_<entity>_save(p_gym_id, p_<entity>_id, …)` inserts when the id is null, otherwise updates. It returns the `uuid`.
- Columns come back in `snake_case`. The repositories map them to the camelCase types in `lib/gym/types.ts`.

### Notes for the NestJS layer
- **Dates:** node-postgres turns `date` into a JS `Date` at local midnight, so IST dates serialize one day early (`…T18:30:00Z`). Register `types.setTypeParser(1082, v => v)` so dates stay `YYYY-MM-DD`.
- `bigint` columns (`count`, `sum`, `total_count`) arrive as strings in node-postgres. Convert them with `Number()`, or register `setTypeParser(20, Number)`. The values are small.
- **Error → HTTP mapping:**

  | SQLSTATE | Meaning | HTTP |
  |---|---|---|
  | `P0002` | not found (raised by the functions) | 404 |
  | `P0004` | change would leave the gym without an active owner | 409 `LAST_OWNER` |
  | `23505` with constraint `uq_attendance_client_day` | duplicate check-in | 409 `DUPLICATE_CHECKIN` |
  | `23505` other (`uq_clients_gym_phone`, `uq_clients_gym_email`, `uq_membership_plans_gym_name`, …) | duplicate | 409 |
  | `23514` | check constraint (bad enum, phone, length) | 400 |
  | `23503` | bad reference | 400 |

## 2. Tables (`01_tables/`)

| Table | Key columns | Constraints / indexes |
|---|---|---|
| `gyms` | name, branch, timezone, currency | — |
| `app_users` | gym_id, name, email `citext`, phone, password_hash, role, is_active, last_login_at | role ∈ owner/trainer/front_desk; unique email (live rows) |
| `refresh_tokens` | gym_id, user_id, token_hash, expires_at, revoked_at | unique token_hash |
| `trainers` | gym_id, user_id?, name, specialty, phone, email?, joined_on | phone `^[6-9]\d{9}$`; unique (gym, phone) |
| `membership_plans` | gym_id, name, duration_months 1–36, price ≥ 1 | unique (gym, lower(name)) |
| `clients` | gym_id, name, phone, email?, gender, joined_on, trainer_id? | gender ∈ male/female/other; unique (gym, phone), (gym, email) |
| `memberships` | gym_id, client_id, plan_id, start_date, end_date (inclusive), amount | end ≥ start |
| `payments` | gym_id, client_id, membership_id?, amount, method, status, payment_date, note ≤ 120 | method ∈ cash/upi/card/bank; status ∈ paid/pending |
| `attendance` | gym_id, client_id, checked_in_at, check_in_date (gym-local, set by trigger) | **unique (gym, client, check_in_date)** = `uq_attendance_client_day` |
| `body_measurements` | gym_id, client_id, measured_on, weight/height/body-fat/girths, notes | unique (gym, client, measured_on) |

Every foreign key is composite, `(gym_id, x_id) → parent (gym_id, id)`, so rows can never point
into another gym. Every tenant table has `(gym_id, …)` indexes for its list/sort queries.

Views (`02_views/`):
- `v_client_current_membership`: one row per client, with the latest-ending membership, its plan, the trainer, `today`, `days_left` and `status` (`none/active/due/expired`).
- `v_active_members`: the same rows where `status in (active, due)`.

Status rule (from `selectors.ts`): `expired` if end < today, `due` if end − today ≤ 7, otherwise `active`.

## 3. Stored functions (`03_functions/`, 45)

### Auth / gym
| Function | Params | Returns |
|---|---|---|
| `usp_user_get_by_email` | `p_email citext` | `id, gym_id, name, email, role, password_hash, is_active` |
| `usp_user_verify_password` | `p_email citext, p_password text` | `id, gym_id, name, email, role, is_active`, only if bcrypt matches and the user is active |
| `usp_user_get_by_id` | `p_gym_id, p_user_id` | `id, gym_id, name, email, role, is_active` |
| `usp_user_touch_login` | `p_gym_id, p_user_id` | `void` |
| `usp_refresh_token_save` | `p_gym_id, p_user_id, p_token_hash text, p_expires_at timestamptz` | `uuid` |
| `usp_refresh_token_get` | `p_token_hash text` | `id, gym_id, user_id, expires_at, revoked_at` |
| `usp_refresh_token_revoke` | `p_gym_id, p_token_hash text` | `boolean` |
| `usp_gym_get` | `p_gym_id` | `id, name, branch, timezone, currency` |

### Staff logins (added 2026-10-25 for the API's `/staff` endpoints)
| Function | Params | Returns |
|---|---|---|
| `usp_user_get_list` | `p_gym_id` | `id, name, email, phone, role, is_active, last_login_at, created_at`, active first, by name |
| `usp_user_save` | `p_gym_id, p_user_id, p_name, p_email citext, p_phone, p_role, p_password_hash` | `uuid`. Insert when the id is null (hash required, made by the API with bcrypt `$2a$`); update ignores the hash |
| `usp_user_set_password` | `p_gym_id, p_user_id, p_password_hash` | `uuid`; also revokes the user's refresh tokens |
| `usp_user_set_active` | `p_gym_id, p_user_id, p_is_active boolean` | `uuid`; deactivating revokes the user's refresh tokens |

`usp_user_save` and `usp_user_set_active` raise **`P0004`** when the change would leave the gym
without an active owner (the API maps it to 409 `LAST_OWNER`).

### Clients
| Function | Params | Returns |
|---|---|---|
| `usp_client_get_paged` | `p_gym_id, p_search text, p_page int, p_page_size int, p_status text = null, p_trainer_id text = null` (`'none'` = no trainer) | `id, name, phone, email, gender, joined_on, trainer_id, trainer_name, membership_id, plan_id, plan_name, start_date, end_date, amount, status, total_count`, ordered by name |
| `usp_client_get_counts` | `p_gym_id` | `total_count, active_count, due_count, expired_count, none_count` |
| `usp_client_get_by_id` | `p_gym_id, p_client_id` | paged shape without `total_count` |
| `usp_client_save` | `p_gym_id, p_client_id, p_name, p_phone, p_email, p_gender, p_trainer_id uuid` | `uuid` (`''` email → null) |
| `usp_client_delete` | `p_gym_id, p_client_id` | `uuid` (soft delete) |

### Trainers / plans / memberships
| Function | Params | Returns |
|---|---|---|
| `usp_trainer_get_paged` | `p_gym_id, p_search, p_page, p_page_size` | `id, name, specialty, phone, email, joined_on, client_count, check_ins_last_7_days, total_count` |
| `usp_trainer_save` | `p_gym_id, p_trainer_id, p_name, p_specialty, p_phone, p_email` | `uuid` |
| `usp_plan_get_list` | `p_gym_id` | `id, name, duration_months, price, active_count` (memberships running today) |
| `usp_plan_save` | `p_gym_id, p_plan_id, p_name, p_duration_months, p_price` | `uuid` |
| `usp_membership_get_paged` | `p_gym_id, p_search, p_page, p_page_size, p_status = null, p_plan_id uuid = null` | `id, client_id, client_name, plan_id, plan_name, start_date, end_date, amount, status, total_count`, newest start first |
| `usp_membership_create` | `p_gym_id, p_client_id, p_plan_id, p_start_date date, p_payment_status, p_method` | `membership_id, payment_id`. One transaction: end = start + months − 1 day, amount = price, linked payment (note = plan name, date = start) |

### Attendance
| Function | Params | Returns |
|---|---|---|
| `usp_attendance_get_paged` | `p_gym_id, p_search, p_page, p_page_size, p_date date = null` (null = today) | `id, checked_in_at, client_id, client_name, client_status, plan_name, trainer_name, total_count` |
| `usp_attendance_get_daily` | `p_gym_id, p_days int = 7` | `check_in_date, check_in_count`, zero-filled, oldest first |
| `usp_attendance_get_list` | `p_gym_id, p_days int = 90` | `id, client_id, checked_in_at`, newest first (store bootstrap) |
| `usp_attendance_get_peak_hour` | `p_gym_id` | `peak_hour, check_in_count` (no row = no check-ins today) |
| `usp_attendance_check_in` | `p_gym_id, p_client_id` | `uuid`; duplicate → 23505 `uq_attendance_client_day` |

### Payments
| Function | Params | Returns |
|---|---|---|
| `usp_payment_get_paged` | `p_gym_id, p_search, p_page, p_page_size, p_status = null, p_method = null` | `id, client_id, client_name, membership_id, amount, method, status, payment_date, note, days_overdue, total_count` |
| `usp_payment_get_totals` | `p_gym_id` | `paid_this_month, pending_total, pending_count` |
| `usp_payment_save` | `p_gym_id, p_payment_id, p_client_id, p_amount, p_method, p_status, p_payment_date, p_note` | `uuid` |
| `usp_payment_mark_paid` | `p_gym_id, p_payment_id` | `uuid` (status paid, date = today) |
| `usp_payment_get_export` | `p_gym_id` | `payment_date, client_name, method, status, amount, note` |

### Dashboard (`GET /dashboard` → `DashboardData`) and reports
| Function | Params | Returns → `DashboardData` field |
|---|---|---|
| `usp_gym_get` | `p_gym_id` | → `gym` |
| `usp_dashboard_get_kpis` | `p_gym_id` | `id, value, previous, format`: 4 rows in order → `kpis` |
| `usp_dashboard_get_revenue_by_month` | `p_gym_id, p_months = 6` | `revenue_month 'YYYY-MM', amount` → `revenueByMonth` (also reports) |
| `usp_attendance_get_daily` | `p_gym_id, 7` (14 for reports) | → `checkInsByDay` |
| `usp_dashboard_get_members_by_plan` | `p_gym_id` | `plan_id, plan_name, member_count` → `membersByPlan` |
| `usp_dashboard_get_renewals` | `p_gym_id` | `id, client_id, member_name, plan, due_date, amount, status` (due/overdue) → `renewals` |
| `usp_dashboard_get_recent_checkins` | `p_gym_id, p_limit = 8` | `id, member_name, checked_in_at, trainer_name` → `recentCheckIns` |
| `usp_dashboard_get_trainer_load` | `p_gym_id` | `id, name, specialty, active_clients, assigned_clients, sessions_today` → `trainers` |
| `usp_dashboard_get_pending_payments` | `p_gym_id, p_limit = 5` | `id, member_name, amount, due_date, days_overdue, total_pending, pending_count` → `pendingPayments` |
| `usp_report_get_summary` | `p_gym_id` | `this_month, new_clients, outstanding, retention_pct` (null = no data) |
| `usp_report_get_paid_by_method` | `p_gym_id` | `method, amount` (last 365 days) |
| `usp_report_get_renewals` | `p_gym_id, p_days = 14` | `client_id, client_name, plan_name, end_date, amount, days_left` |

KPI "previous" values: active members = members on the same day last month; revenue = last
month's total; check-ins = the 30-day daily average; renewals = the same count a week ago.

### Body measurements (no screen yet)
| Function | Params | Returns |
|---|---|---|
| `usp_body_measurement_get_by_client` | `p_gym_id, p_client_id` | `id, client_id, measured_on, weight_kg, height_cm, body_fat_pct, chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes` |
| `usp_body_measurement_save` | `p_gym_id, p_measurement_id, p_client_id, p_measured_on, p_weight_kg, p_height_cm, p_body_fat_pct, p_chest_cm, p_waist_cm, p_hips_cm, p_arm_cm, p_thigh_cm, p_notes` | `uuid` |

## 4. Auth contract

- **Login:** call `usp_user_get_by_email(email)`, then `bcrypt.compare(password, password_hash)` (or call `usp_user_verify_password` instead). Reject when `is_active = false`. Then `usp_user_touch_login`. The JWT is `{ sub: id, gymId: gym_id, role }`. `gymId` only ever comes from the JWT, never from a request.
- **Hashing:** bcrypt, cost 10. Seeds use pgcrypto `crypt(pw, gen_salt('bf', 10))`, which gives `$2a$` hashes that `bcrypt` and `bcryptjs` verify. For new users created by the API, hash with bcrypt in Node. If you also want `usp_user_verify_password` to verify those, generate `$2a$`-prefixed hashes (e.g. `bcryptjs` v2), because older pgcrypto builds don't read `$2b$`.
- **Refresh tokens** are stored as a sha256 hash. Rotation = `usp_refresh_token_revoke(old)` + `usp_refresh_token_save(new)`.

## 5. Demo data (`04_seed/01_demo_gym.sql`)

Gym `FITVA Demo Gym` (Kothrud, Pune), id `0f17a000-0000-4000-a000-000000000001`.

| | Email | Password | Role |
|---|---|---|---|
| Rohan Deshmukh | owner@fitvademo.in | Owner@123 | owner |
| Sneha Kulkarni | trainer@fitvademo.in | Trainer@123 | trainer |
| Arjun Patil | trainer2@fitvademo.in | Trainer@123 | trainer |
| Priya Joshi | frontdesk@fitvademo.in | Desk@123 | front_desk |

The rest of the seed:
- 3 trainers and 4 plans.
- 12 clients: 6 active, 2 due, 3 expired (1 of them overdue), 1 with no membership.
- 13 memberships and 16 payments (3 pending).
- About 30 days of check-ins and 4 body measurements.

Expected counts after a fresh apply: gyms 1, app_users 4, trainers 3, membership_plans 4,
clients 12, memberships 13, payments 16, body_measurements 4, attendance ≈ 140–180 (deterministic
spread over about 270 eligible client-days).
