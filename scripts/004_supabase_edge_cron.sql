-- Supabase cron -> call Edge Function `trigger-push-cron`
--
-- How to use:
-- 1) In Supabase SQL Editor, run section (A) once.
-- 2) Set your Function Secrets:
--    - SITE_BASE_URL  (your Netlify deployed URL)
--    - CRON_SECRET    (same value your Next.js /api/push-cron checks)
--    - TRIGGER_TOKEN  (optional)
-- 3) Replace <PROJECT_REF> below and (optionally) <TRIGGER_TOKEN>.
-- 4) Run section (B).
--
-- Notes:
-- - pg_cron schedules are in UTC.
-- - 09:00 Asia/Tashkent (UTC+5) == 04:00 UTC

-- (A) Enable required extensions (run once)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- (B) Create / update the schedule
-- If TRIGGER_TOKEN is NOT set, remove the 'Authorization' header line.
select
  cron.schedule(
    'trigger-push-cron-daily',
    '0 4 * * *',
    $$
    select
      net.http_post(
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/trigger-push-cron',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer <TRIGGER_TOKEN>'
        ),
        body := '{}'::jsonb
      );
    $$
  );

-- (C) Helpful: list your cron jobs
-- select * from cron.job;
