// Supabase Edge Function (Deno)
//
// What it does:
// - Calls your deployed Next.js endpoint: GET /api/push-cron
// - Forwards CRON_SECRET in the Authorization header: Bearer <CRON_SECRET>
//
// Why:
// - Lets you schedule cron in Supabase instead of Netlify Scheduled Functions
// - Avoids Netlify/AWS Lambda environment-variable size limits
//
// Supabase Secrets to set (Project Settings -> Functions -> Secrets):
// - SITE_BASE_URL  e.g. https://your-site.netlify.app
// - CRON_SECRET    same value checked by /api/push-cron
// Optional:
// - TRIGGER_TOKEN  if set, this Edge Function also requires:
//                 Authorization: Bearer <TRIGGER_TOKEN>

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

serve(async (req) => {
  try {
    const siteBaseUrl = Deno.env.get("SITE_BASE_URL")?.trim();
    const cronSecret = Deno.env.get("CRON_SECRET")?.trim();
    const triggerToken = Deno.env.get("TRIGGER_TOKEN")?.trim();

    if (!siteBaseUrl) return json({ ok: false, error: "Missing SITE_BASE_URL" }, 500);
    if (!cronSecret) return json({ ok: false, error: "Missing CRON_SECRET" }, 500);

    if (triggerToken) {
      const auth = req.headers.get("authorization") || "";
      if (auth !== `Bearer ${triggerToken}`) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
    }

    const url = new URL("/api/push-cron", siteBaseUrl).toString();

    const res = await fetch(url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${cronSecret}`,
      },
    });

    const text = await res.text().catch(() => "");
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep as text
    }

    return json(
      {
        ok: res.ok,
        status: res.status,
        url,
        response: body,
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : String(e), timestamp: new Date().toISOString() },
      500,
    );
  }
});
