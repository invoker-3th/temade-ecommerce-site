import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const allowedRoles = ["customer", "admin", "editor", "viewer"] as const
type AllowedRole = (typeof allowedRoles)[number]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updates: Partial<{ role: AllowedRole; disabled: boolean }> = {}

    if (body.role && allowedRoles.includes(body.role)) {
      updates.role = body.role
    }
    if (typeof body.disabled === "boolean") {
      updates.disabled = body.disabled
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const db = await getDatabase()
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )

    if (!result.matchedCount) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin users PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
