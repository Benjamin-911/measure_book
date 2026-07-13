-- Measurement tracker schema
-- Run this in the Supabase SQL editor (fresh install)

create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz default now()
);

-- Current/active measurement profile per client (one per client)
create table measurement_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  unit text not null default 'in' check (unit in ('in', 'cm')),

  -- dress / top fields
  bust numeric,
  waist numeric,
  hip numeric,
  shoulder_width numeric,
  sleeve_length numeric,
  bodice_length numeric,
  neck numeric,
  arm_hole numeric,

  -- trouser / skirt fields
  inseam numeric,
  trouser_length numeric,
  skirt_length numeric,

  fit_notes text,
  taken_date date not null default current_date,
  created_at timestamptz default now()
);

-- Historical snapshots, written automatically whenever a profile is remeasured
create table measurement_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  snapshot jsonb not null,
  taken_date date not null,
  created_at timestamptz default now()
);

create index idx_clients_user on clients(user_id);
create index idx_measurement_profiles_client on measurement_profiles(client_id);
create unique index idx_measurement_profiles_client_unique on measurement_profiles(client_id);
create index idx_measurement_history_client on measurement_history(client_id);
create index idx_clients_name on clients using gin (to_tsvector('english', name));

-- Auto-set user_id from the authenticated user on insert
create or replace function set_client_user_id()
returns trigger as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger clients_set_user_id
  before insert on clients
  for each row execute function set_client_user_id();

-- Row Level Security
alter table clients enable row level security;
alter table measurement_profiles enable row level security;
alter table measurement_history enable row level security;

-- Clients: users can only access their own clients
create policy "Users can view own clients"
  on clients for select
  using (auth.uid() = user_id);

create policy "Users can insert own clients"
  on clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own clients"
  on clients for update
  using (auth.uid() = user_id);

create policy "Users can delete own clients"
  on clients for delete
  using (auth.uid() = user_id);

-- Measurement profiles: access via client ownership
create policy "Users can view own measurement profiles"
  on measurement_profiles for select
  using (
    exists (
      select 1 from clients
      where clients.id = measurement_profiles.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Users can insert own measurement profiles"
  on measurement_profiles for insert
  with check (
    exists (
      select 1 from clients
      where clients.id = measurement_profiles.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Users can update own measurement profiles"
  on measurement_profiles for update
  using (
    exists (
      select 1 from clients
      where clients.id = measurement_profiles.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Users can delete own measurement profiles"
  on measurement_profiles for delete
  using (
    exists (
      select 1 from clients
      where clients.id = measurement_profiles.client_id
        and clients.user_id = auth.uid()
    )
  );

-- Measurement history: access via client ownership
create policy "Users can view own measurement history"
  on measurement_history for select
  using (
    exists (
      select 1 from clients
      where clients.id = measurement_history.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Users can insert own measurement history"
  on measurement_history for insert
  with check (
    exists (
      select 1 from clients
      where clients.id = measurement_history.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Users can delete own measurement history"
  on measurement_history for delete
  using (
    exists (
      select 1 from clients
      where clients.id = measurement_history.client_id
        and clients.user_id = auth.uid()
    )
  );
