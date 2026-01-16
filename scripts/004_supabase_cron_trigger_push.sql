-- Supabase Cron -> HTTP call to Edge Function
--
-- 1) Enable required extensions (run once)
--    - pg_cron: scheduling
--    - pg_net:  HTTP requests from Postgres
--
-- NOTE: In Supabase, extensions availability depends on your plan/project.
-- If an extension is not available, Supabase will show an error.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Create a daily schedule at 09:00 Asia/Tashkent (UTC+5) => 04:00 UTC
-- Netlify schedule used: 0 4 * * * (UTC). We'll mirror that.
--
-- Replace <PROJECT_REF> with your Supabase project ref.
-- The Edge Function URL format:
-- https://<PROJECT_REF>.supabase.co/functions/v1/trigger-push-cron
--
-- IMPORTANT: Put your CRON_SECRET in the HTTP header.

select
  cron.schedule(
    'trigger_push_cron_daily_0400_utc',
    '0 4 * * *',
    $$
    select
      net.http_post(
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/trigger-push-cron',
        headers := jsonb_build_object(
          'content-type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    $$
  );

-- If you want to run it every 15 minutes instead (for testing):
-- select cron.schedule('trigger_push_cron_every_15m', '*/15 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/trigger-push-cron',
--     headers := jsonb_build_object('content-type','application/json'),
--     body := '{}'::jsonb
--   );
-- $$);
