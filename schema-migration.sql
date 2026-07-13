-- ============================================================
-- MIGRATION: for databases that already ran the OLD schema.sql
-- (before user_id + RLS were added)
--
-- Do NOT re-run schema.sql — your tables already exist.
-- Run THIS file once in Supabase SQL Editor.
-- ============================================================

-- 1. Add user_id column (safe to run even if already added)
alter table clients add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Assign existing clients to YOUR account.
--    Find your UUID: Supabase Dashboard → Authentication → Users → copy User UID
--    Then uncomment the line below, paste your UUID, and run it:
--
-- update clients set user_id = 'PASTE-YOUR-USER-UUID-HERE' where user_id is null;

-- 3. After step 2, make user_id required (uncomment when ready):
-- alter table clients alter column user_id set not null;

-- 4. Indexes (safe to re-run)
create index if not exists idx_clients_user on clients(user_id);
create unique index if not exists idx_measurement_profiles_client_unique on measurement_profiles(client_id);

-- 5. Auto-set user_id on new client inserts
create or replace function set_client_user_id()
returns trigger as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists clients_set_user_id on clients;
create trigger clients_set_user_id
  before insert on clients
  for each row execute function set_client_user_id();

-- 6. Enable Row Level Security
alter table clients enable row level security;
alter table measurement_profiles enable row level security;
alter table measurement_history enable row level security;

-- 7. Policies (drop first so this script is safe to re-run)
drop policy if exists "Users can view own clients" on clients;
drop policy if exists "Users can insert own clients" on clients;
drop policy if exists "Users can update own clients" on clients;
drop policy if exists "Users can delete own clients" on clients;

create policy "Users can view own clients"
  on clients for select using (auth.uid() = user_id);

create policy "Users can insert own clients"
  on clients for insert with check (auth.uid() = user_id);

create policy "Users can update own clients"
  on clients for update using (auth.uid() = user_id);

create policy "Users can delete own clients"
  on clients for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own measurement profiles" on measurement_profiles;
drop policy if exists "Users can insert own measurement profiles" on measurement_profiles;
drop policy if exists "Users can update own measurement profiles" on measurement_profiles;
drop policy if exists "Users can delete own measurement profiles" on measurement_profiles;

create policy "Users can view own measurement profiles"
  on measurement_profiles for select
  using (exists (select 1 from clients where clients.id = measurement_profiles.client_id and clients.user_id = auth.uid()));

create policy "Users can insert own measurement profiles"
  on measurement_profiles for insert
  with check (exists (select 1 from clients where clients.id = measurement_profiles.client_id and clients.user_id = auth.uid()));

create policy "Users can update own measurement profiles"
  on measurement_profiles for update
  using (exists (select 1 from clients where clients.id = measurement_profiles.client_id and clients.user_id = auth.uid()));

create policy "Users can delete own measurement profiles"
  on measurement_profiles for delete
  using (exists (select 1 from clients where clients.id = measurement_profiles.client_id and clients.user_id = auth.uid()));

drop policy if exists "Users can view own measurement history" on measurement_history;
drop policy if exists "Users can insert own measurement history" on measurement_history;
drop policy if exists "Users can delete own measurement history" on measurement_history;

create policy "Users can view own measurement history"
  on measurement_history for select
  using (exists (select 1 from clients where clients.id = measurement_history.client_id and clients.user_id = auth.uid()));

create policy "Users can insert own measurement history"
  on measurement_history for insert
  with check (exists (select 1 from clients where clients.id = measurement_history.client_id and clients.user_id = auth.uid()));

create policy "Users can delete own measurement history"
  on measurement_history for delete
  using (exists (select 1 from clients where clients.id = measurement_history.client_id and clients.user_id = auth.uid()));
