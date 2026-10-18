# FITVA / GymFit — Frontend Analysis (Phase 0)

Scope: the Next.js app at the repo root (`D:\GymFit\Gym-Fit-Code-Base`). The new API will live in
`backend/` (NestJS) and the SQL in `database/`, both at the repo root next to the frontend.

---

## 1. Framework, layout, data fetching

| Item | Finding |
|---|---|
| Framework | Next.js 15 App Router, React 19, TS strict, Tailwind v4, shadcn/ui, RHF + Zod (`package.json`) |
| Route groups | `app/(marketing)/*` (landing, login, signup, legal) · `app/(app)/dashboard/*` (signed-in area, guarded in `app/(app)/layout.tsx`) |
| Gym pages | Thin server pages `app/(app)/dashboard/{clients,memberships,trainers,attendance,payments,reports}/page.tsx` → client views `components/gym/*-view.tsx` |
| Data access (gym pages) | **No network calls.** Every view uses `useGym()` from `lib/gym/store.tsx`. It loads the **whole gym dataset at once** (`GymData`) via `loadGymData()` in `lib/gym/data-source.ts` (mock seed from `lib/gym/mock-data.ts` + `localStorage` key `gymfit:demo-data:v1`). All filtering, search, sorting and aggregation happen **client-side** (`lib/gym/selectors.ts`, inline `useMemo`s). |
| Data access (dashboard) | `getDashboardData()` in `lib/dashboard/get-dashboard-data.ts` — server-side. With `DASHBOARD_DATA_SOURCE=api` it does **`GET {API_BASE_URL}/dashboard`** (no auth yet — `TODO(api)`), expecting `DashboardData` (`lib/dashboard/types.ts`). This is the **only existing fetch call** to a backend. |
| No react-query / axios | Plain `fetch` (dashboard only). |
| Existing `/api` routes | Only `app/api/auth/[...all]/route.ts` (Better Auth handler). |
| Explicit contracts | `lib/gym/types.ts` and `lib/dashboard/types.ts` are both documented as "the CONTRACT between the UI and the backend". Money = whole rupees (int), dates = `YYYY-MM-DD`, timestamps = ISO, ids = strings. |
| Locale / TZ | en-IN, INR, **Asia/Kolkata** for "today" and hour buckets (`lib/dashboard/format.ts`, `attendance-view.tsx:140-152`). |

## 2. Screens and the data each one reads/writes

| Screen | Reads | Writes (store action) |
|---|---|---|
| `/dashboard` (`app/(app)/dashboard/page.tsx`, `components/dashboard/*`) | `DashboardData`: gym name/branch, 4 KPIs with previous value, revenue by month (6), check-ins by day (7), members by plan, renewals (due/overdue), recent check-ins (with trainer name), trainer load, pending payments | — |
| Clients (`clients-view.tsx`) | clients + current membership + plan + trainer + derived status; stats total/active/due/expired; filters: search (name/phone/email), status (`active/due/expired/none`), trainer (`all/none/<id>`) | `addClient({name, phone, email, gender, trainerId})` |
| Memberships (`memberships-view.tsx`) | memberships joined with client name, plan name, status; filters search (client name), status, plan; per-plan "active today" count; plans list | `addPlan({name, durationMonths, price})`, `addMembership({clientId, planId, startDate, paymentStatus, method})` → server computes `endDate = startDate + months − 1 day`, `amount = plan.price` **and creates a linked payment** (`note = plan.name`, `date = startDate`) |
| Trainers (`trainers-view.tsx`) | trainers + their clients + check-ins of those clients in last 7 days; search (name/specialty) | `addTrainer({name, specialty, phone, email})` |
| Attendance (`attendance-view.tsx`) | check-ins for a chosen date with client row (status), search by client name; per-day counts (last 14/30), today's peak hour (IST) | `checkIn(clientId)` → returns `"duplicate"` if already checked in **today** |
| Payments (`payments-view.tsx`) | payments + client name, sorted date desc; filters search (client name/note), status, method; overdue days for pending; totals paid this month / pending | `addPayment({clientId, amount, method, status, date, note})`, `markPaymentPaid(id)` → status `paid`, date = today |
| Reports (`reports-view.tsx`) | revenue last 6 months, paid this month, new clients this month, outstanding, 90-day renewal rate, check-ins last 14 days, active members by plan, paid by method (last 365 d), trainer load, renewals next 14 days; CSV export of all payments | — |
| Login (`components/auth/demo-login-form.tsx`, `login-form.tsx`) | — | Demo: username/password `Admin/1234` → signed cookie (`lib/demo-auth.ts`). Real: Better Auth email+password / Google |
| Signup (`signup-form.tsx`) | — | Better Auth sign-up (name, email, password); "coming soon" in demo mode |
| Landing demo form (`app/actions/demo.ts`) | — | Server action, logs only — **out of scope** for the gym API |

## 3. Derived entities

Status is **derived, never stored** (`lib/gym/types.ts:17`, `selectors.ts:16-21`):
`expired` if `endDate < today`; `due` if `endDate − today ≤ 7`; else `active`; `none` if a client has no membership.
A client's status comes from the membership with the **latest `endDate`** (`selectors.ts:24-31`).

| Entity | Fields (frontend → DB) | Source |
|---|---|---|
| **gym** (tenant) | id, name, branch, timezone (`Asia/Kolkata`), currency (`INR`) | `DashboardData.gym` (`lib/dashboard/types.ts:55`), TZ from `lib/dashboard/format.ts` |
| **app_user** (auth) | id, gym_id, name, email (citext, unique), password_hash (argon2), role (`owner`/`trainer`/`client`), is_active | `lib/session.ts` (`CurrentUser {id,name,email}`), `lib/demo-auth.ts:15-20` (`role: "owner"`), `content/landing.ts:425` (`RoleId`) |
| **refresh_token** | id, user_id, token_hash, expires_at, revoked_at | required by the spec (refresh tokens) |
| **trainer** | id, name (2–80), specialty (2–80), phone (Indian 10-digit `^[6-9]\d{9}$`), email (optional), joined_on, user_id (nullable, for a future trainer login) | `lib/gym/types.ts:20-27`, `lib/schemas/gym.ts:25-30` |
| **plan** | id, name (2–40), duration_months (1–36), price (int ≥ 1) | `types.ts:29-34`, `schemas/gym.ts:33-41` |
| **client** | id, name (2–80), phone, email (optional), gender (`male/female/other`), joined_on, trainer_id (nullable) | `types.ts:36-44`, `schemas/gym.ts:15-22` |
| **membership** | id, client_id, plan_id, start_date, end_date (inclusive), amount | `types.ts:46-55`, `store.tsx:102-133` |
| **attendance** | id, client_id, checked_in_at (timestamptz); max one per client per gym-local day | `types.ts:57-61`, `store.tsx:150-161` |
| **payment** | id, client_id, membership_id (nullable), amount, method (`cash/upi/card/bank`), status (`paid/pending`), date (received or due), note (≤120) | `types.ts:63-73`, `schemas/gym.ts:56-63` |

Every tenant table also gets `gym_id`, `is_deleted`, `created_at`, `updated_at`.

## 4. API endpoints

There is only one existing call to match exactly: **`GET /dashboard` → `DashboardData`**. Everything
else is proposed, shaped to the store actions so swapping `store.tsx` bodies is mechanical. All are
under `/api/v1`, apart from `/dashboard` (see Q3). Lists return `{ data, meta: { page, pageSize, total } }`
and single items return `{ data }`. Items are the exact `lib/gym/types.ts` shapes (camelCase, string ids).

| Method | Path | Request | Response `data` |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, expiresIn, user: { id, name, email, role, gymId } }` |
| POST | `/auth/refresh` | `{ refreshToken }` | same as login (refresh token rotated) |
| POST | `/auth/logout` | `{ refreshToken }` | `{ ok: true }` |
| GET | `/auth/me` | — | `CurrentUser` + `role`, `gymId` |
| GET | `/dashboard` | — | `DashboardData` (**unwrapped**, exact shape — see Q3) |
| GET | `/gym-data` | — | `GymData` — the full dataset bootstrap that `loadGymData()` needs today (see Q2) |
| GET | `/clients` | `?page&pageSize&search&status=active\|due\|expired\|none&trainerId=<id>\|none` | `ClientRow[]` (client + membership + plan + trainer + status) + `meta.counts {active,due,expired,none}` |
| GET | `/clients/:id` | — | `ClientRow` |
| POST | `/clients` | `NewClient {name, phone, email, gender, trainerId\|null}` | `Client` |
| PUT | `/clients/:id` | same as POST | `Client` |
| DELETE | `/clients/:id` | — | `{ id }` (soft delete) |
| GET | `/trainers` | `?search&page&pageSize` | `Trainer & { clientCount, checkInsLast7Days }` |
| POST | `/trainers` | `NewTrainer {name, specialty, phone, email}` | `Trainer` |
| GET | `/plans` | — (cached) | `Plan & { activeCount }` |
| POST | `/plans` | `NewPlan {name, durationMonths, price}` | `Plan` (invalidates the cache) |
| GET | `/memberships` | `?page&pageSize&search&status&planId` | `Membership & { clientName, planName, status }`, sorted startDate desc |
| POST | `/memberships` | `NewMembership {clientId, planId, startDate, paymentStatus, method}` | `{ membership, payment }` (one transaction) |
| GET | `/attendance` | `?date=YYYY-MM-DD&search&page&pageSize` | `{ id, checkedInAt, client: ClientRow }`, newest first |
| GET | `/attendance/summary` | `?days=30` | `{ perDay: {date,count}[], peakHourToday: number\|null }` |
| POST | `/attendance` | `{ clientId }` | `201 AttendanceRecord` · **`409 { code: "DUPLICATE_CHECKIN" }`** if already checked in today |
| GET | `/payments` | `?page&pageSize&search&status&method` | `Payment & { clientName }`, date desc + `meta.totals {paidThisMonth, pending}` |
| POST | `/payments` | `NewPayment {clientId, amount, method, status, date, note}` | `Payment` |
| PATCH | `/payments/:id/mark-paid` | — | `Payment` (status paid, date = gym-local today) |
| GET | `/payments/export.csv` | — | CSV (`date, client, method, status, amount, note`) |
| GET | `/reports` | — | `{ thisMonth, newClients, outstanding, retention\|null, revenue[6], checkIns[14], byPlan[], methods[], trainers[], renewals[] }` |

`gymId` is never accepted in a body or query. It always comes from the JWT.

## 5. Auth / role logic in the frontend

- `app/(app)/layout.tsx` redirects to `/login` when `getCurrentUser()` is null. That's the only protected route group.
- `AUTH_MODE=demo` (default): hard-coded `Admin / 1234` (a **username**, not an email), HMAC cookie. `AUTH_MODE=better-auth`: Better Auth + Prisma tables `user/session/account/verification` in Postgres (`prisma/schema.prisma`).
- **No role checks anywhere in the UI.** Only the demo user carries `role: "owner"`. Trainer/Client roles appear only in landing-page copy (`content/landing.ts:425-485`). Every dashboard screen is an owner screen.
- Neither auth system issues a token the frontend could forward to an API (`get-dashboard-data.ts:31` TODO).

## 6. Open questions / mismatches — please confirm

1. **Measurements / progress, workout & diet plans** are on the landing page only. **No screen, type or form exists** for them. Your spec lists a `measurements/` module. Following "don't invent features", I propose to **skip measurements for now**. OK?
2. **Load model.** The UI loads everything once and filters client-side. I'll build the paged, filterable endpoints you asked for, **plus** `GET /gym-data` so the frontend can switch over today with only `data-source.ts`/`store.tsx` changes. Later the views can move to the paged endpoints. Keep `/gym-data`?
3. **Path prefix.** The frontend calls `{API_BASE_URL}/dashboard` and expects the **raw** `DashboardData` (no `{ data }` envelope). Proposal: global prefix `/api/v1`, `API_BASE_URL=http://localhost:4000/api/v1`, and `/dashboard` returns the raw shape (the only exception to the envelope). Or should I wrap it and change the 1-line frontend parser?
4. **Auth integration.** The NestJS API will own login (email + password → JWT). That replaces Better Auth/Prisma and demo auth for the dashboard. The Next server would store the tokens in an httpOnly cookie and forward `Authorization: Bearer`. That is a **frontend change** (not done in this task). Should I (a) build only the API now, or (b) also wire the frontend? Should the new tables live in the same `gymfit` database as the Prisma/Better Auth tables (I'd use a separate schema, `fitva`), or in a new database?
5. **Roles.** Owner is the only role the UI uses. Plan: the JWT carries `role`, and every gym endpoint is `@Roles('owner')` for now. Trainer/client access is added when their screens exist. OK?
6. **Update/delete.** The UI has no edit or delete actions except "mark paid". Your spec asks for `usp_client_save` (upsert) + `usp_client_delete`. I'll add upsert/delete for **clients** (as specified) and do create + list only for the others, plus mark-paid. Do you want edit/delete for trainers/plans/memberships/payments too?
7. **"overdue" membership status.** `MemberStatus` includes `overdue` (used by dashboard renewals), but `selectors.ts` only produces active/due/expired. Proposal: dashboard renewals = `due` (ends in 0–7 days) plus `overdue` (expired within the last 7 days with no newer membership). Confirm the window.
8. **KPI "previous" values.** Proposal: activeMembers = count at the same day last month; revenueThisMonth = last month total; checkInsToday = 30-day daily average; renewalsDue = count one week ago. These match the labels in `content/dashboard.ts`. OK?
9. **Seed login.** The demo uses `Admin / 1234`. Real seed users will be e.g. `owner@demo.gym / Owner@123`, `trainer@demo.gym / Trainer@123`. Fine?
10. **Duplicate check-in** will be enforced in the DB (unique on `gym_id, client_id, gym-local date`), not just in the UI.
