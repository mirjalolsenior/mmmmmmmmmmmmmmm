import { NextResponse } from "next/server"
import { checkAndSendDeliveryNotifications, checkAndSendInventoryNotifications } from "@/lib/push-notification-service"
import { createServiceClient } from "@/lib/supabase/service"

// Ensure this route is always executed dynamically on the server (Netlify/Next runtime).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cron] Starting notification checks...")
    const startTime = Date.now()

    // Read low-stock threshold from DB (fallback: 10)
    let threshold = 10
    try {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "inventory_low_stock_threshold")
        .maybeSingle()

      if (!error) {
        const n = Number((data?.value as any)?.threshold)
        if (Number.isFinite(n) && n >= 0 && n <= 100000) threshold = Math.floor(n)
      } else {
        console.warn("[Cron] app_settings read error:", error.message)
      }
    } catch (e: any) {
      console.warn("[Cron] Failed to read threshold, using default 10:", e?.message)
    }

    const [deliveryResult, inventoryResult] = await Promise.allSettled([
      checkAndSendDeliveryNotifications(),
      checkAndSendInventoryNotifications(threshold),
    ])

    const duration = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        message: "Notification checks completed",
        duration: `${duration}ms`,
        checks: [
          {
            type: "delivery_dates",
            status: deliveryResult.status === "fulfilled" ? "completed" : "failed",
            error: deliveryResult.status === "rejected" ? deliveryResult.reason?.message : null,
          },
          {
            type: "inventory",
            status: inventoryResult.status === "fulfilled" ? "completed" : "failed",
            error: inventoryResult.status === "rejected" ? inventoryResult.reason?.message : null,
            threshold,
          },
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Cron] Error in push-cron endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function HEAD() {
  return NextResponse.json({ status: "ok" })
}
