-- Tournaments table
create table if not exists public.tournaments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  format text not null check (format in ('americano', 'mexicano', 'mixicano')),
  points_per_match int not null check (points_per_match in (16, 24, 32)),
  court_count int not null check (court_count between 1 and 8),
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  players jsonb not null default '[]',
  rounds jsonb not null default '[]'
);

-- Index for fast user lookups
create index if not exists tournaments_user_id_idx on public.tournaments(user_id);
create index if not exists tournaments_created_at_idx on public.tournaments(user_id, created_at desc);

-- Enable Row Level Security
alter table public.tournaments enable row level security;

-- Users can only see their own tournaments
create policy "Users can view own tournaments"
  on public.tournaments for select
  using (auth.uid() = user_id);

-- Users can only insert their own tournaments
create policy "Users can insert own tournaments"
  on public.tournaments for insert
  with check (auth.uid() = user_id);

-- Users can only update their own tournaments
create policy "Users can update own tournaments"
  on public.tournaments for update
  using (auth.uid() = user_id);

-- Users can only delete their own tournaments
create policy "Users can delete own tournaments"
  on public.tournaments for delete
  using (auth.uid() = user_id);
