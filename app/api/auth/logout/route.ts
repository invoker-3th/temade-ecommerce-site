import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionClearCookieOptions,
  revokeAdminSessionFromRequest,
} from "@/lib/server/sessionAuth"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ success: true })
    }

    const db = await getDatabase()
    await db.collection("admin_login_sessions").updateOne(
      { email },
      { $set: { loggedIn: false, updatedAt: new Date() } },
      { upsert: true }
    )

    await revokeAdminSessionFromRequest(request)

    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_SESSION_COOKIE, "", getAdminSessionClearCookieOptions())
    return response
  } catch (error) {
    console.error("Logout route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
