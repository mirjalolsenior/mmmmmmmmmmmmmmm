import { NextResponse } from "next/server"

// Ensure this route is always executed dynamically on the server (Netlify/Next runtime).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
import { getPublicVAPIDKey } from "@/lib/vapid-keys"

export async function GET() {
  return NextResponse.json({
    publicKey: getPublicVAPIDKey(),
  })
}
