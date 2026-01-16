import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// Ensure this route is always executed dynamically on the server (Netlify/Next runtime).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    // Use SERVICE_ROLE on the server so RLS doesn't block subscription writes/reads.
    // (Never expose SERVICE_ROLE to the browser; this runs only on the server.)
    const supabase = createServiceClient()
    const subscription = await request.json()

    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const userAgent = request.headers.get("user-agent") || ""
    let platform = "web"
    if (userAgent.includes("Android")) platform = "android"
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) platform = "ios"

    // Keep DB writes compatible with a minimal schema:
    // id, endpoint, p256dh, auth, platform, user_agent, created_at
    // (If your table has extra columns, they can remain nullable.)
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        user_agent: userAgent,
        platform,
        created_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

    if (error) {
      console.error("[Push] Subscription storage error:", error)
      return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 })
    }

    console.log(`[Push] Subscription stored (${platform})`)
    return NextResponse.json({ success: true, message: "Successfully subscribed", platform })
  } catch (error) {
    console.error("[Push] Subscribe error:", error)
    return NextResponse.json({ error: "Failed to subscribe to push notifications" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Push subscription endpoint ready" })
}
