import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
