-- Shared trigger: keeps updated_at current on every UPDATE.
create or replace function fn_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
