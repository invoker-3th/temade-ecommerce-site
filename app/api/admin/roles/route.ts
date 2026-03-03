import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { getPermissionsForUser, requirePermissionFromRequest } from "@/lib/server/permissionGuard"
import { writeAuditLog } from "@/lib/audit"
import { getAdminSessionFromRequest } from "@/lib/server/sessionAuth"

export async function GET(request: Request) {
  const session = await getAdminSessionFromRequest(request)
  const email = String(session?.email || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "Missing admin identity" }, { status: 401 })

  const { user, permissions, roles } = await getPermissionsForUser(email)
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

  const isSuperAdmin = permissions.includes("*")
  if (isSuperAdmin) {
    const db = await getDatabase()
    const allRoles = await db.collection("roles").find().sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ roles: allRoles, isSuperAdmin: true, readOnly: false })
  }

  return NextResponse.json({ roles, isSuperAdmin: false, readOnly: true })
}

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "*")
  if (!perm.ok) return NextResponse.json({ error: "Only super admins can create roles" }, { status: 403 })

  const body = await request.json()
  const { name, description, permissions, emailSubscriptions } = body
  if (!name || !Array.isArray(permissions)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    const db = await getDatabase()
    const now = new Date()
    const doc = {
      name,
      description: description || "",
      permissions,
      emailSubscriptions: Array.isArray(emailSubscriptions) ? emailSubscriptions : [],
      createdAt: now,
      updatedAt: now,
      createdBy: perm.adminEmail,
    }
    const res = await db.collection("roles").insertOne(doc)
    await writeAuditLog({ actorEmail: perm.adminEmail, action: "role.create", targetId: String(res.insertedId), metadata: { name } })
    return NextResponse.json({ roleId: res.insertedId })
  } catch (err) {
    console.error("Create role error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const perm = await requirePermissionFromRequest(request, "*")
  if (!perm.ok) return NextResponse.json({ error: "Only super admins can edit roles" }, { status: 403 })

  const body = await request.json()
  const { roleId, name, description, permissions, emailSubscriptions } = body
  if (!roleId || !ObjectId.isValid(roleId)) return NextResponse.json({ error: "Valid roleId required" }, { status: 400 })

  try {
    const db = await getDatabase()
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (Array.isArray(permissions)) updates.permissions = permissions
    if (Array.isArray(emailSubscriptions)) updates.emailSubscriptions = emailSubscriptions

    await db.collection("roles").updateOne({ _id: new ObjectId(roleId) }, { $set: updates })
    await writeAuditLog({ actorEmail: perm.adminEmail, action: "role.update", targetId: roleId })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Update role error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const perm = await requirePermissionFromRequest(request, "*")
  if (!perm.ok) return NextResponse.json({ error: "Only super admins can delete roles" }, { status: 403 })

  const body = await request.json()
  const { roleId } = body
  if (!roleId || !ObjectId.isValid(roleId)) return NextResponse.json({ error: "Valid roleId required" }, { status: 400 })

  try {
    const db = await getDatabase()
    await db.collection("roles").deleteOne({ _id: new ObjectId(roleId) })
    await db.collection("users").updateMany({ roles: roleId }, { $pull: { roles: roleId } })
    await writeAuditLog({ actorEmail: perm.adminEmail, action: "role.delete", targetId: roleId })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete role error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
