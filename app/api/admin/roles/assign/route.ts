import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"
import { writeAuditLog } from "@/lib/audit"

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "admin:roles:assign")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const { roleId, email } = body
  if (!roleId || !email) return NextResponse.json({ error: "roleId and email are required" }, { status: 400 })

  try {
    const db = await getDatabase()
    const usersCol = db.collection("users")
    const user = await usersCol.findOne({ email: { $regex: `^${email}$`, $options: "i" } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // add roleId to roles array
    await usersCol.updateOne({ _id: user._id }, { $addToSet: { roles: roleId }, $set: { updatedAt: new Date() } })
    await writeAuditLog({ actorEmail: perm.adminEmail, action: "role.assign", targetEmail: email, targetId: String(user._id), metadata: { roleId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Assign role error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const perm = await requirePermissionFromRequest(request, "admin:roles:assign")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const { roleId, email } = body
  if (!roleId || !email) return NextResponse.json({ error: "roleId and email are required" }, { status: 400 })

  try {
    const db = await getDatabase()
    const usersCol = db.collection("users")
    const user = await usersCol.findOne({ email: { $regex: `^${email}$`, $options: "i" } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await usersCol.updateOne({ _id: user._id }, { $pull: { roles: roleId }, $set: { updatedAt: new Date() } })
    await writeAuditLog({ actorEmail: perm.adminEmail, action: "role.unassign", targetEmail: email, targetId: String(user._id), metadata: { roleId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unassign role error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
