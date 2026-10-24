-- Trainer load for the dashboard and reports. active_clients = assigned clients who are active
-- or due (dashboard TrainerLoad); assigned_clients = every assigned client (reports-view.tsx);
-- sessions_today = today's check-ins by assigned clients.
drop function if exists usp_dashboard_get_trainer_load(uuid);

create function usp_dashboard_get_trainer_load(p_gym_id uuid)
returns table (
  id                uuid,
  name              text,
  specialty         text,
  active_clients    bigint,
  assigned_clients  bigint,
  sessions_today    bigint
)
language sql stable as $$
  select
    t.id, t.name, t.specialty,
    (select count(*) from v_active_members v where v.gym_id = t.gym_id and v.trainer_id = t.id),
    (select count(*) from clients c
      where c.gym_id = t.gym_id and c.trainer_id = t.id and not c.is_deleted),
    (select count(*)
      from attendance a
      join clients c on c.gym_id = a.gym_id and c.id = a.client_id and not c.is_deleted
      where a.gym_id = t.gym_id
        and c.trainer_id = t.id
        and not a.is_deleted
        and a.check_in_date = s.today)
  from trainers t
  cross join (select fn_gym_today(p_gym_id) as today) s
  where t.gym_id = p_gym_id and not t.is_deleted
  order by 4 desc, 2
$$;
