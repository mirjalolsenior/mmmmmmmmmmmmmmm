import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// Ensure this route is always executed dynamically on the server (Netlify/Next runtime).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export const maxDuration = 30

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get subscription stats
    const { count: totalSubsCount } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })

    // Backwards/forwards compatible: some schemas don't have is_active.
    // If it's missing, we'll just treat all subscriptions as active.
    let activeSubsCount: number | null = null
    try {
      const { count } = await supabase
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
      activeSubsCount = count ?? null
    } catch {
      activeSubsCount = null
    }

    // Optional stats from logs (if tables/columns exist)
    let sentCount = 0
    let failedCount = 0
    try {
      const { data: recentLogs } = await supabase
        .from("notification_logs")
        .select("status")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      sentCount = recentLogs?.filter((l: any) => l.status === "sent").length || 0
      failedCount = recentLogs?.filter((l: any) => l.status === "failed").length || 0
    } catch {
      // ignore
    }

    let checkLogs: any[] = []
    try {
      const { data } = await supabase
        .from("notification_check_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(10)
      checkLogs = data || []
    } catch {
      // ignore
    }

    return NextResponse.json({
      status: "healthy",
      subscriptions: {
        total: totalSubsCount || 0,
        active: activeSubsCount ?? totalSubsCount || 0,
      },
      notifications_24h: {
        sent: sentCount,
        failed: failedCount,
        success_rate: sentCount + failedCount > 0 ? ((sentCount / (sentCount + failedCount)) * 100).toFixed(1) : "N/A",
      },
      recent_checks: checkLogs?.slice(0, 5) || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Health] Check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
