-- Un seul administrateur. Le plus ancien est conservé si plusieurs existent.

update profiles
set is_admin = false
where is_admin
  and user_id <> (
    select user_id from profiles where is_admin order by created_at asc limit 1
  );

create unique index if not exists profiles_single_admin
  on profiles (is_admin)
  where is_admin;
