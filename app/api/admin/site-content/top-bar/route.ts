import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdminFromRequest } from "@/lib/server/adminGuard"

const COLLECTION = "site_content"
const KEY = "top_bar"
const DEFAULT_MESSAGE = "Shop New Arrivals on TemAde today!"
const MAX_LENGTH = 180

type TopBarDoc = {
  key: string
  message: string
  updatedAt: Date
  updatedBy?: string
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminFromRequest(request)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const db = await getDatabase()
    const doc = await db.collection<TopBarDoc>(COLLECTION).findOne({ key: KEY })
    const message = String(doc?.message || DEFAULT_MESSAGE).trim() || DEFAULT_MESSAGE
    return NextResponse.json({ message })
  } catch (error) {
    console.error("Admin top bar settings GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminFromRequest(request)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const body = await request.json()
    const message = String(body?.message || "").trim()

    if (!message) {
      return NextResponse.json({ error: "Banner message is required" }, { status: 400 })
    }
    if (message.length > MAX_LENGTH) {
      return NextResponse.json({ error: `Banner message cannot exceed ${MAX_LENGTH} characters` }, { status: 400 })
    }

    const db = await getDatabase()
    await db.collection<TopBarDoc>(COLLECTION).updateOne(
      { key: KEY },
      {
        $set: {
          key: KEY,
          message,
          updatedAt: new Date(),
          updatedBy: admin.adminEmail,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("Admin top bar settings PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
