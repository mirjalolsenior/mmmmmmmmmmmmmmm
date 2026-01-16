/**
 * Netlify Scheduled Function (Node)
 * Daily check:
 *  - Zakaz: 1 kun oldin + o'sha kuni (va kechikkanlar)
 *  - Ombor: kam qolgan / tugagan
 *
 * This function simply calls the existing Next.js route: /api/push-cron
 *
 * Required ENV:
 * - CRON_SECRET  (same value checked in /api/push-cron)
 *
 * Note:
 * - Netlify runs schedules in UTC.
 * - Asia/Tashkent is UTC+5 => 04:00 UTC = 09:00 Tashkent.
 */

exports.config = {
  schedule: "0 4 * * *",
}

exports.handler = async function handler() {
  const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3000"
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn("[Netlify Cron] CRON_SECRET is missing. Skipping.")
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "CRON_SECRET missing" }),
    }
  }

  const url = `${baseUrl}/api/push-cron`

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { authorization: `Bearer ${cronSecret}` },
    })

    const text = await res.text().catch(() => "")

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: res.ok, status: res.status, url, response: text }),
    }
  } catch (e) {
    console.error("[Netlify Cron] fetch failed:", e)
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, url, error: e?.message || "unknown" }),
    }
  }
}
