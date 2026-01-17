import { type NextRequest, NextResponse } from "next/server"
import { sendPushNotificationToAll, initWebPush } from "@/lib/push-notification-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { title, body, icon } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ ok: false, error: "Title and body are required" }, { status: 400 })
    }

    // Initialize web-push
    if (!initWebPush()) {
      return NextResponse.json({ ok: false, error: "VAPID keys not configured" }, { status: 400 })
    }

    const result = await sendPushNotificationToAll({ title, body, icon })

    // result.success = nechta device muvaffaqiyatli yuborildi
    return NextResponse.json({
      ok: true,
      message: `Push notification sent to ${result.success} devices`,
      ...result,
    })
  } catch (error) {
    console.error("[v0] Send push error:", error)
    return NextResponse.json({ ok: false, error: "Failed to send push notification" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Push sending endpoint ready. Use POST to send notifications." })
}
