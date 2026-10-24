-- Stat tiles on the Clients page (meta.counts).
drop function if exists usp_client_get_counts(uuid);

create function usp_client_get_counts(p_gym_id uuid)
returns table (
  total_count    bigint,
  active_count   bigint,
  due_count      bigint,
  expired_count  bigint,
  none_count     bigint
)
language sql stable as $$
  select
    count(*),
    count(*) filter (where v.status = 'active'),
    count(*) filter (where v.status = 'due'),
    count(*) filter (where v.status = 'expired'),
    count(*) filter (where v.status = 'none')
  from v_client_current_membership v
  where v.gym_id = p_gym_id
$$;
