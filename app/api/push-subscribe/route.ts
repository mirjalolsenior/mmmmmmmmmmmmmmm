import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: NextRequest) {
  try {
    // Use SERVICE_ROLE on the server so RLS doesn't block subscription writes/reads.
    // (Never expose SERVICE_ROLE to the browser; this runs only on the server.)
    const supabase = createServiceClient()
    const subscription = await request.json()

    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .single()

    if (existing) {
      // Update last activity instead of creating duplicate
      await supabase
        .from("push_subscriptions")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
          last_verified: new Date().toISOString(),
        })
        .eq("endpoint", subscription.endpoint)

      console.log("[Push] Updated existing subscription")
      return NextResponse.json({ success: true, message: "Subscription updated" })
    }

    const userAgent = request.headers.get("user-agent") || ""
    let platform = "web"
    if (userAgent.includes("Android")) platform = "android"
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) platform = "ios"

    const { error } = await supabase.from("push_subscriptions").insert({
      endpoint: subscription.endpoint,
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
      user_agent: userAgent,
      platform,
      browser: extractBrowser(userAgent),
      is_active: true,
      last_verified: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[Push] Subscription storage error:", error)
      return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 })
    }

    console.log(`[Push] New subscription stored (${platform})`)
    return NextResponse.json({ success: true, message: "Successfully subscribed", platform })
  } catch (error) {
    console.error("[Push] Subscribe error:", error)
    return NextResponse.json({ error: "Failed to subscribe to push notifications" }, { status: 500 })
  }
}

function extractBrowser(userAgent: string): string {
  if (userAgent.includes("Chrome")) return "chrome"
  if (userAgent.includes("Safari")) return "safari"
  if (userAgent.includes("Firefox")) return "firefox"
  if (userAgent.includes("Edge")) return "edge"
  return "unknown"
}

export async function GET() {
  return NextResponse.json({ message: "Push subscription endpoint ready" })
}
