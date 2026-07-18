-- ============================================================
-- Thapar Roomie Finder - Database Schema
-- Run this whole file in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1. PROFILES
-- id matches auth.users.id (Supabase's built-in auth table)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  branch text,
  year int,
  gender text,
  sleep_time int default 23,        -- hour 0-23, when they usually sleep
  cleanliness int default 3,        -- 1 (messy) - 5 (very clean)
  noise_tolerance int default 3,    -- 1 (needs silence) - 5 (doesn't mind noise)
  food_pref text,                   -- 'veg' | 'nonveg' | 'either'
  study_style text,                 -- 'library' | 'room' | 'group' | 'late-night'
  smoking boolean default false,
  guests_ok boolean default true,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

-- Anyone logged in can view all profiles (needed to compute matches)
create policy "profiles are viewable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

-- Users can only insert/update their own profile
create policy "users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id);


-- 2. LIKES
create table if not exists likes (
  id bigint generated always as identity primary key,
  from_user uuid references auth.users(id) on delete cascade not null,
  to_user uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique (from_user, to_user)
);

alter table likes enable row level security;

create policy "users can view likes involving them"
  on likes for select
  using (auth.uid() = from_user or auth.uid() = to_user);

create policy "users can insert their own likes"
  on likes for insert
  with check (auth.uid() = from_user);


-- 3. MESSAGES
-- user_a / user_b are always stored sorted (smaller uuid first) so a pair
-- always maps to one consistent conversation.
create table if not exists messages (
  id bigint generated always as identity primary key,
  user_a uuid not null,
  user_b uuid not null,
  sender_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table messages enable row level security;

create policy "users can view messages in their own conversation"
  on messages for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "users can send messages in their own conversation"
  on messages for insert
  with check (
    (auth.uid() = user_a or auth.uid() = user_b)
    and auth.uid() = sender_id
  );

-- Enable realtime for messages so chat updates live
alter publication supabase_realtime add table messages;
