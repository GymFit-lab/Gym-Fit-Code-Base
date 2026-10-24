-- Small helpers used by the views and usp_* functions. Not part of the API contract.

-- "Today" in the gym's time zone.
create or replace function fn_gym_today(p_gym_id uuid) returns date
language sql stable as $$
  select (now() at time zone coalesce(
    (select g.timezone from gyms g where g.id = p_gym_id), 'Asia/Kolkata'))::date
$$;

-- Membership status, same rule as lib/gym/selectors.ts (DUE_WINDOW_DAYS = 7).
create or replace function fn_membership_status(p_end_date date, p_today date) returns text
language sql immutable as $$
  select case
    when p_end_date is null then 'none'
    when p_end_date < p_today then 'expired'
    when p_end_date - p_today <= 7 then 'due'
    else 'active'
  end
$$;

-- ILIKE pattern for a free-text search; null when the search is empty. Escapes % _ and \.
create or replace function fn_like_pattern(p_search text) returns text
language sql immutable as $$
  select case when nullif(btrim(p_search), '') is null then null
    else '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  end
$$;

-- Paging: 1-based page, page size clamped to 1..500 (default 20).
create or replace function fn_page_limit(p_page_size integer) returns integer
language sql immutable as $$
  select least(greatest(coalesce(p_page_size, 20), 1), 500)
$$;

create or replace function fn_page_offset(p_page integer, p_page_size integer) returns integer
language sql immutable as $$
  select (greatest(coalesce(p_page, 1), 1) - 1) * fn_page_limit(p_page_size)
$$;
