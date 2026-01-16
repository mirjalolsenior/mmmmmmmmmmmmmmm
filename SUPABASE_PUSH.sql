-- Run this in Supabase SQL Editor (safe to run multiple times)

-- Push subscriptions table (Web Push / Android Chrome / iOS Safari PWA 16.4+)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text not null default 'web',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

-- Helpful index for cleanup / reporting
create index if not exists push_subscriptions_created_at_idx on public.push_subscriptions(created_at desc);
