import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

const SETTING_KEY = "inventory_low_stock_threshold"

export const maxDuration = 60

async function readThreshold(): Promise<number> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.from("app_settings").select("value").eq("key", SETTING_KEY).maybeSingle()
  if (error) {
    console.warn("[Settings] Failed to read threshold:", error.message)
    return 10
  }

  const raw = (data?.value as any)?.threshold
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 100000) return 10
  return Math.floor(n)
}

export async function GET() {
  try {
    const threshold = await readThreshold()
    return NextResponse.json({ success: true, threshold }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const threshold = Number(body?.threshold)

    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100000) {
      return NextResponse.json(
        { success: false, error: "threshold raqami 0..100000 oralig'ida bo'lishi kerak" },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from("app_settings").upsert(
      {
        key: SETTING_KEY,
        value: { threshold: Math.floor(threshold) },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, threshold: Math.floor(threshold) }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 })
  }
}
