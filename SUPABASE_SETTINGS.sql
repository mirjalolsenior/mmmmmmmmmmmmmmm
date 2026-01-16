-- Run this in Supabase SQL Editor

-- App settings table (stores admin-configurable values)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Default low-stock threshold (used for "tovar kam qolganda" notifications)
insert into public.app_settings (key, value)
values ('inventory_low_stock_threshold', '{"threshold": 10}'::jsonb)
on conflict (key) do nothing;
