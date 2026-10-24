-- Records a successful login.
drop function if exists usp_user_touch_login(uuid, uuid);

create function usp_user_touch_login(p_gym_id uuid, p_user_id uuid)
returns void
language plpgsql as $$
begin
  update app_users u
  set last_login_at = now()
  where u.gym_id = p_gym_id and u.id = p_user_id and not u.is_deleted;
end;
$$;
