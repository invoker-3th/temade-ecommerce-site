import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"
import { writeAuditLog } from "@/lib/audit"

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "admin:roles:assign")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const body = await request.json()
    const { email, roleIds } = body
    if (!email || !Array.isArray(roleIds)) return NextResponse.json({ error: "email and roleIds required" }, { status: 400 })

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ email: { $regex: `^${email}$`, $options: "i" } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await db.collection("users").updateOne({ _id: user._id }, { $set: { roles: roleIds, updatedAt: new Date() } })
    await writeAuditLog({ actorEmail: perm.adminEmail, action: "role.set", targetEmail: email, targetId: String(user._id), metadata: { roleIds } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Set roles error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
