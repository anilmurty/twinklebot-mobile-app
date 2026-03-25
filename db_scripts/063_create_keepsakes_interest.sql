-- Migration: 063_create_keepsakes_interest.sql
-- Description: Create keepsakes_interest table for demand validation
-- Created: 2026-03-24

create table keepsakes_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  story_count_at_signup int,
  story_id_at_signup uuid,
  product_votes jsonb default '{}'
);

-- RLS: users can only read/write their own row
alter table keepsakes_interest enable row level security;

create policy "Users manage own interest"
  on keepsakes_interest for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
