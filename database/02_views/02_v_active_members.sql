-- Clients who count as members today (status active or due, as isActiveStatus in selectors.ts).
drop view if exists v_active_members;

create view v_active_members as
select *
from v_client_current_membership
where status in ('active', 'due');
