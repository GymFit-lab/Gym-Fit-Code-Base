# FITVA API — guide for app developers

REST API for the FITVA gym app (Android, and optionally the website). Every example below is a
**real response** from the API running against the demo gym (captured 2026-10-25, lists shortened).

- **Base URL:** `https://api.<your-domain>` in production (see `DEPLOY.md`). In development: run
  `dotnet run --project backend/src/FitvaApi`; the Android emulator reaches it at
  `http://10.0.2.2:5076`.
- **Interactive docs (development only):** `http://localhost:5076/swagger`. Click **Authorize** and
  paste an `accessToken`.
- **Demo logins** (development database only): `owner@fitvademo.in / Owner@123`,
  `frontdesk@fitvademo.in / Desk@123`, `trainer@fitvademo.in / Trainer@123`.

## 1. Conventions

| Thing | Format |
|---|---|
| Body | JSON, `Content-Type: application/json`, **camelCase** fields |
| IDs | UUID strings, e.g. `"0f17a000-0004-4000-a000-000000000001"` |
| Money | **whole rupees** as integers (`1500` = ₹1,500); format it in the app |
| Dates | `"YYYY-MM-DD"`, the **gym's local date** (Asia/Kolkata). Never shift these by a timezone. |
| Timestamps | ISO 8601 UTC, e.g. `"2026-10-19T12:08:00Z"`. Convert to local time for display. |
| Months | `"YYYY-MM"` |
| "Today" | Always the gym's local date, worked out by the server. Never send "today" from the phone. |
| Empty values | `null` (e.g. `trainerId`, `email`). Send `null` or `""` for "none". |

**The gym always comes from the token.** No request takes a gym id, so a user can only ever see
and change their own gym's data.

## 2. Authentication

```
POST /auth/login ──► accessToken (15 min) + refreshToken (30 days)
every call       ──► Authorization: Bearer <accessToken>
401 on a call    ──► POST /auth/refresh with the refreshToken → new pair (the old refresh token stops working)
POST /auth/logout──► revokes the refresh token
```

### POST /auth/login (anonymous)

```json
{ "email": "owner@fitvademo.in", "password": "Owner@123" }
```

`200 OK`:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOi…",
  "refreshToken": "1VzTqsVmnBgfcGuHyq4tNzqR5RJWq9smaNPLNRyZXmg",
  "expiresIn": 900,
  "user": {
    "id": "0f17a000-0001-4000-a000-000000000001",
    "name": "Rohan Deshmukh",
    "email": "owner@fitvademo.in",
    "role": "owner",
    "gymId": "0f17a000-0000-4000-a000-000000000001"
  }
}
```

| Status | When |
|---|---|
| `401` `"Invalid email or password"` | Wrong email **or** password, or the login is deactivated. The message is the same in every case on purpose. |
| `400` with `errors` | Malformed email or empty password |
| `429` with `Retry-After` header | More than **5 attempts per minute** from one IP |

### POST /auth/refresh (anonymous)

`{ "refreshToken": "…" }` → `200` with the same shape as login, including a **new refresh
token**. Each refresh token works **once**. Reusing one, or using it after logout, a password
change or deactivation, gives `401` `"Invalid or expired refresh token"`. Then send the user to
the login screen.

**Refresh only once at a time.** If several requests get `401` together, refresh **once** and
retry them all with the new token (see the Kotlin example in §7). If two refreshes run in
parallel with the same token, the second one fails.

### POST /auth/logout (anonymous)

`{ "refreshToken": "…" }` → `200 { "ok": true }`, always. Delete both tokens on the phone.

### GET /auth/me

`200`: the `user` object from login. `401` if the token is invalid, or the login was deactivated.

### POST /auth/change-password (any signed-in user)

```json
{ "currentPassword": "Owner@123", "newPassword": "New#Password1" }
```

`200` with a **new token pair for this device**. Replace the stored tokens. Every other device is
signed out. `400` `"Current password is incorrect"`; new passwords must be 8–128 characters.

### Storing tokens on Android

Keep both tokens in **EncryptedSharedPreferences**, or in DataStore encrypted with an Android
Keystore key. Never put them in plain SharedPreferences or in logs. The refresh token is the
long-lived secret.

## 3. Roles

| Area | owner | front_desk | trainer |
|---|:-:|:-:|:-:|
| Dashboard, clients, trainers, plans, memberships, attendance (read) | ✅ | ✅ | ✅ |
| Add/edit clients, sell memberships, check in, payments | ✅ | ✅ | — |
| Delete clients, add/edit trainers and plans, CSV export, reports, staff logins | ✅ | — | — |

Calling something outside the role gives **`403`** with an empty body. Hide those buttons in the
app using `user.role`.

## 4. Errors

Errors use the standard **ProblemDetails** JSON:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.10",
  "title": "Already exists",
  "status": 409,
  "code": "DUPLICATE",
  "constraint": "uq_membership_plans_gym_name",
  "traceId": "00-b053d91e3f1403158ffb182a65a67b69-6d3469f7d8c044e3-00"
}
```

Validation errors (`400`) list messages per field:

```json
{
  "title": "Validation failed",
  "status": 400,
  "errors": {
    "email": ["'Email' is not a valid email address."],
    "password": ["'Password' must not be empty."]
  }
}
```

| Status | `code` | Meaning / what the app should do |
|---|---|---|
| 400 | — (`errors` map) | Show each message next to its field |
| 400 | `INVALID_VALUE` / `BAD_REFERENCE` | The server rejected a value. Usually an app bug; show a generic error. |
| 401 | — | Token missing or expired → refresh, then retry once. If the refresh fails → log in. |
| 403 | — (empty body) | Not allowed for this role |
| 404 | `NOT_FOUND` or none | The record doesn't exist (or is in another gym) |
| 409 | `DUPLICATE_CHECKIN` | The client already checked in today. Show "Already checked in." |
| 409 | `DUPLICATE` | Phone / email / plan name already used. `constraint` says which: `uq_clients_gym_phone`, `uq_clients_gym_email`, `uq_membership_plans_gym_name`, `uq_app_users_email`. |
| 409 | `LAST_OWNER` | The change would leave the gym without an active owner |
| 429 | — | Too many requests (5 logins/min per IP; 300 requests/min per user). Wait for `Retry-After` seconds. |
| 5xx | — | Server problem. Show a retry option; include `traceId` in bug reports. |

## 5. Paged lists

`GET /clients`, `/trainers`, `/memberships`, `/attendance` and `/payments` take
`?page=1&pageSize=20&search=…` (page from 1, pageSize 1–200, search up to 100 characters,
case-insensitive substring). They return:

```json
{ "items": [ … ], "meta": { "page": 1, "pageSize": 20, "total": 13 } }
```

Some lists add extra totals to `meta` (shown below). Filter values `""` and `"all"` mean
"no filter".

## 6. Endpoints

### Clients

**`GET /clients`**: `?status=all|active|due|expired|none&trainerId=all|none|<id>` + paging.
Ordered by name. Each row is the client plus their **current** membership:

```json
{
  "items": [
    {
      "id": "0f17a000-0004-4000-a000-000000000001",
      "name": "Aditya Pawar",
      "phone": "9822011201",
      "email": "aditya.pawar@gmail.com",
      "gender": "male",
      "joinedOn": "2025-12-24",
      "trainerId": "0f17a000-0002-4000-a000-000000000001",
      "trainerName": "Sneha Kulkarni",
      "membershipId": "0f17a000-0005-4000-a000-000000000002",
      "planId": "0f17a000-0003-4000-a000-000000000004",
      "planName": "Annual",
      "startDate": "2026-03-29",
      "endDate": "2027-03-28",
      "amount": 13000,
      "status": "active"
    }
  ],
  "meta": {
    "page": 1, "pageSize": 2, "total": 13,
    "counts": { "total": 13, "active": 6, "due": 1, "expired": 4, "none": 2 }
  }
}
```

`status`:
- `none`: no membership yet.
- `active`.
- `due`: ends within 7 days.
- `expired`: ended before today.

**`GET /clients/{id}`**: one row, the same shape as the list items. `404` if not found.

**`POST /clients`** (owner, front desk) → `201` with the client row:

```json
{ "name": "Sample Member", "phone": "9653801630", "email": "sample@example.in", "gender": "female", "trainerId": null }
```

- `name` 2–80 characters.
- `phone`: an Indian mobile number, 10 digits starting 6–9.
- `email` optional (`""` or `null`).
- `gender`: `male` | `female` | `other`.
- `trainerId` optional; `404` if it doesn't exist.
- A duplicate phone or email gives `409 DUPLICATE`.

The response for a new client:

```json
{
  "id": "cef0bce3-588e-47c2-907d-2c18a4428a02", "name": "Sample Member", "phone": "9653801630",
  "email": "sample@example.in", "gender": "female", "joinedOn": "2026-10-25",
  "trainerId": null, "trainerName": null, "membershipId": null, "planId": null, "planName": null,
  "startDate": null, "endDate": null, "amount": null, "status": "none"
}
```

**`PUT /clients/{id}`** (owner, front desk): the same body → `200` with the client row.

**`DELETE /clients/{id}`** (owner) → `200 { "id": "…" }`. This is a soft delete: the client
disappears from lists, but past payments still count in the reports.

### Trainers

**`GET /trainers`**: paging; search matches name or specialty.

```json
{
  "items": [
    {
      "id": "0f17a000-0002-4000-a000-000000000002", "name": "Arjun Patil",
      "specialty": "Weight Loss & HIIT", "phone": "9822001003", "email": "trainer2@fitvademo.in",
      "joinedOn": "2025-12-24", "clientCount": 4, "checkInsLast7Days": 2
    }
  ],
  "meta": { "page": 1, "pageSize": 1, "total": 3 }
}
```

**`POST /trainers`** / **`PUT /trainers/{id}`** (owner):
`{ "name", "specialty", "phone", "email" }` → `201` / `200` with the trainer row. `name` and
`specialty` are 2–80 characters; `email` is optional.

### Plans

**`GET /plans`**: every plan, shortest first. `activeCount` = memberships running today.

```json
[
  { "id": "0f17a000-0003-4000-a000-000000000001", "name": "Monthly", "durationMonths": 1, "price": 1500, "activeCount": 1 },
  { "id": "0f17a000-0003-4000-a000-000000000002", "name": "Quarterly", "durationMonths": 3, "price": 4000, "activeCount": 2 }
]
```

**`POST /plans`** / **`PUT /plans/{id}`** (owner): `{ "name": "Monthly", "durationMonths": 1, "price": 1500 }`.
- `name` 2–40 characters and unique in the gym (else `409 DUPLICATE`).
- `durationMonths` 1–36; `price` ≥ 1.
- Changing the price doesn't affect memberships already sold.

### Memberships

**`GET /memberships`**: `?status=all|active|due|expired&planId=<id>` + paging. Newest first;
search matches the client's name.

```json
{
  "items": [
    {
      "id": "0f17a000-0005-4000-a000-000000000010", "clientId": "0f17a000-0004-4000-a000-000000000008",
      "clientName": "Pooja Nair", "planId": "0f17a000-0003-4000-a000-000000000001", "planName": "Monthly",
      "startDate": "2026-10-11", "endDate": "2026-11-10", "amount": 1500, "status": "active"
    }
  ],
  "meta": { "page": 1, "pageSize": 1, "total": 13 }
}
```

**`POST /memberships`** (owner, front desk) sells a plan **and records its payment in one step**:

```json
{ "clientId": "…", "planId": "…", "startDate": "2026-10-25", "paymentStatus": "pending", "method": "upi" }
```

- `startDate` optional; `null` = today.
- `paymentStatus`: `paid` | `pending`.
- `method`: `cash` | `upi` | `card` | `bank`.
- `endDate` = start + plan months − 1 day (inclusive); amount = plan price.

`201` returns `{ "membership": <membership row>, "payment": <payment row> }`.

### Attendance (check-ins)

**`GET /attendance`**: check-ins on one day, newest first. `?date=YYYY-MM-DD` (default today) +
paging; search matches the client's name.

```json
{
  "items": [
    {
      "id": "da1c3ce4-29a5-4380-844b-baeee8c718e4", "checkedInAt": "2026-10-19T12:08:00Z",
      "clientId": "0f17a000-0004-4000-a000-000000000010", "clientName": "Shruti Kale",
      "clientStatus": "active", "planName": "Half-Yearly", "trainerName": "Arjun Patil"
    }
  ],
  "meta": { "page": 1, "pageSize": 1, "total": 6 }
}
```

**`GET /attendance/summary?days=30`** (1–366): one entry per day, zero-filled, oldest first,
plus today's busiest hour (0–23, `null` if no check-ins today):

```json
{ "perDay": [ { "date": "2026-10-23", "count": 0 }, { "date": "2026-10-24", "count": 0 }, { "date": "2026-10-25", "count": 3 } ], "peakHourToday": 0 }
```

**`GET /attendance/recent?days=90`** (1–366): every check-in in that period, newest first. Use it
for bulk loading or offline caching:

```json
[ { "id": "e9ced3c6-313e-4065-93e3-898e6d7db6b0", "clientId": "0f17a000-0004-4000-a000-000000000004", "checkedInAt": "2026-10-20T11:30:00Z" } ]
```

**`POST /attendance`** (owner, front desk): `{ "clientId": "…" }` → `201` with the check-in row.
**A second check-in the same day → `409 DUPLICATE_CHECKIN`.** Unknown client → `404`.

### Payments (owner, front desk)

**`GET /payments`**: `?status=all|paid|pending&method=all|cash|upi|card|bank` + paging. Newest
first; search matches the client name or the note. `meta.totals` covers the whole gym:

```json
{
  "items": [
    {
      "id": "a992db06-eb75-4406-89c3-e547baf7ae59", "clientId": "9776e028-58c6-475a-b44f-4653d6334e70",
      "clientName": "Test Operations", "membershipId": null, "amount": 500, "method": "cash",
      "status": "paid", "date": "2026-10-25", "note": "Test fee", "daysOverdue": 0
    }
  ],
  "meta": {
    "page": 1, "pageSize": 1, "total": 22,
    "totals": { "paidThisMonth": 5000, "pendingTotal": 10500, "pendingCount": 6 }
  }
}
```

`daysOverdue` = days since `date` for pending payments, otherwise 0.

**`POST /payments`**: `{ "clientId", "amount", "method", "status", "date", "note" }` → `201` with
the payment row. `amount` ≥ 1; `date` optional (`null` = today); `note` up to 120 characters.

**`PATCH /payments/{id}/mark-paid`** → `200` with the payment row: status `paid`, dated today.
Payments already paid are left unchanged.

**`GET /payments/export.csv`** (owner): a CSV download (UTF-8 with BOM, opens in Excel):

```
date,client,method,status,amount,note
2026-10-25,Test Operations,cash,paid,500,Test fee
```

### Dashboard (any role)

**`GET /dashboard`**: everything the home screen needs in one call. It has exactly the shape of
`lib/dashboard/types.ts`. Arrays are shortened here: revenue has 6 months, check-ins 7 days,
recent check-ins up to 8, pending payments up to 5.

```json
{
  "gym": { "name": "FITVA Demo Gym", "branch": "Kothrud, Pune" },
  "generatedAt": "2026-10-24T19:26:26.2734631Z",
  "kpis": [
    { "id": "activeMembers", "value": 7, "previous": 8, "format": "number" },
    { "id": "revenueThisMonth", "value": 5000, "previous": 24300, "format": "currency" },
    { "id": "checkInsToday", "value": 3, "previous": 4, "format": "number" },
    { "id": "renewalsDue", "value": 2, "previous": 3, "format": "number" }
  ],
  "revenueByMonth": [ { "month": "2026-05", "amount": 7500 } ],
  "checkInsByDay": [ { "date": "2026-10-19", "count": 6 } ],
  "membersByPlan": [ { "plan": "Annual", "count": 2 } ],
  "renewals": [ { "id": "0f17a000-0005-4000-a000-000000000006", "memberName": "Siddharth More", "plan": "Monthly", "dueDate": "2026-10-23", "amount": 1500, "status": "overdue" } ],
  "recentCheckIns": [ { "id": "e9ced3c6-313e-4065-93e3-898e6d7db6b0", "memberName": "Kavya Iyer", "checkedInAt": "2026-10-20T11:30:00Z", "trainerName": "Vikram Shinde" } ],
  "trainers": [ { "id": "0f17a000-0002-4000-a000-000000000003", "name": "Vikram Shinde", "specialty": "Yoga & Mobility", "activeClients": 3, "sessionsToday": 0 } ],
  "pendingPayments": { "total": 10500, "items": [ { "id": "bcb9173f-0581-4a9f-b327-6e02e045291a", "memberName": "Siddharth More", "amount": 1500, "dueDate": "2026-09-24", "daysOverdue": 31 } ] }
}
```

`previous` is the comparison value for each KPI:
- `activeMembers`: the same day last month.
- `revenueThisMonth`: last month's total.
- `checkInsToday`: the 30-day daily average.
- `renewalsDue`: a week ago.

### Reports (owner)

**`GET /reports`**: `retention` is the renewal rate over the last 90 days in %, `null` when no
membership ended in that time. Revenue covers 6 months, check-ins 14 days, renewals the next
14 days, and methods the last 365 days.

```json
{
  "thisMonth": 5000, "newClients": 3, "outstanding": 10500, "retention": 20,
  "revenue": [ { "month": "2026-05", "amount": 7500 } ],
  "checkIns": [ { "date": "2026-10-12", "count": 4 } ],
  "byPlan": [ { "plan": "Annual", "count": 2 } ],
  "methods": [ { "method": "bank", "amount": 20500 } ],
  "trainers": [ { "id": "0f17a000-0002-4000-a000-000000000003", "name": "Vikram Shinde", "specialty": "Yoga & Mobility", "activeClients": 3, "assignedClients": 3, "sessionsToday": 0 } ],
  "renewals": [ { "clientId": "0f17a000-0004-4000-a000-000000000002", "clientName": "Neha Gokhale", "planName": "Quarterly", "endDate": "2026-10-25", "amount": 4000, "daysLeft": 0 } ]
}
```

### Staff logins (owner)

**`GET /staff`**: every login of the gym, active first. Password hashes are never returned.

```json
[ { "id": "0f17a000-0001-4000-a000-000000000003", "name": "Arjun Patil", "email": "trainer2@fitvademo.in", "phone": "9822001003", "role": "trainer", "isActive": true, "lastLoginAt": null, "createdAt": "2026-10-20T18:10:43.663617Z" } ]
```

| Call | Body | Result |
|---|---|---|
| `POST /staff` | `{ "name", "email", "phone"?, "role", "password" }` | `201` with the staff row. `role`: `owner`, `trainer` or `front_desk`; password 8–128 characters; email unique across all gyms (`409 DUPLICATE`). |
| `PUT /staff/{id}` | `{ "name", "email", "phone"?, "role" }` | `200` with the staff row |
| `POST /staff/{id}/password` | `{ "password" }` | `204`. Signs that person out of every device. |
| `POST /staff/{id}/deactivate` | — | `200` with the row. They can't log in, and their refresh tokens are revoked. |
| `POST /staff/{id}/activate` | — | `200` with the row |

Demoting or deactivating the **last active owner** gives `409 LAST_OWNER`.

### Health (anonymous)

**`GET /health`** → `200 {"status":"ok","database":"ok"}`, or `503` when the database is down.

## 7. Android setup (Retrofit + OkHttp)

```kotlin
interface FitvaApi {
    @POST("auth/login") suspend fun login(@Body body: LoginRequest): AuthResponse
    @GET("dashboard") suspend fun dashboard(): DashboardData
    @GET("clients") suspend fun clients(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null,
    ): Page<ClientRow>
    @POST("attendance") suspend fun checkIn(@Body body: CheckInRequest): AttendanceRow
}

// The refresh call uses a separate, plain client (no authenticator), so it can't recurse.
interface AuthApi {
    @POST("auth/refresh") fun refresh(@Body body: RefreshRequest): Call<AuthResponse>
}

/** On 401: refresh once (other threads wait and reuse the result), then retry the request. */
class TokenAuthenticator(private val tokens: TokenStore, private val auth: AuthApi) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.priorResponse != null) return null // already retried once
        val sent = response.request.header("Authorization")?.removePrefix("Bearer ")
        synchronized(this) {
            val current = tokens.accessToken
            if (current != null && current != sent) return response.request.withToken(current) // another thread refreshed
            val refreshToken = tokens.refreshToken ?: return null
            val result = auth.refresh(RefreshRequest(refreshToken)).execute()
            if (!result.isSuccessful) { tokens.clear(); return null } // → show the login screen
            val pair = result.body()!!
            tokens.save(pair.accessToken, pair.refreshToken)
            return response.request.withToken(pair.accessToken)
        }
    }
    private fun Request.withToken(t: String) = newBuilder().header("Authorization", "Bearer $t").build()
}
```

An interceptor adds `Authorization: Bearer <accessToken>` to every request except
`auth/login`, `auth/refresh` and `auth/logout`.

**Plain HTTP in development:** Android blocks `http://` by default. For the debug build only,
allow `10.0.2.2` (emulator) or your PC's LAN IP with `res/xml/network_security_config.xml` in
the `debug` source set. A physical phone also needs the API to listen on the network
(`ASPNETCORE_URLS=http://0.0.0.0:5076`) and port 5076 open in the PC's firewall. Release builds
must use HTTPS.
