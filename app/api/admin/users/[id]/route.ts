import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"
import { writeAuditLog } from "@/lib/audit"
import { getAllowlistedAdmins } from "@/lib/server/adminAllowlist"

const allowedRoles = ["customer", "admin", "editor", "viewer"] as const
type AllowedRole = (typeof allowedRoles)[number]

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermissionFromRequest(request, "users:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const { id } = await params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid user id required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Return full profile details (including role assignment array if present)
    return NextResponse.json({
      user: {
        _id: String(user._id),
        email: user.email,
        userName: user.userName,
        phone: user.phone || "",
        role: user.role || "customer",
        roles: Array.isArray(user.roles) ? user.roles : [],
        disabled: Boolean(user.disabled),
        isEmailVerified: Boolean(user.isEmailVerified),
        emailVerifiedAt: user.emailVerifiedAt || null,
        preferences: user.preferences || null,
        address: user.address || null,
        cart: Array.isArray(user.cart) ? user.cart : [],
        wishlist: Array.isArray(user.wishlist) ? user.wishlist : [],
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
      },
    })
  } catch (error) {
    console.error("Admin user GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermissionFromRequest(request, "users:manage")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const { id } = await params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid user id required" }, { status: 400 })
    }
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

    await writeAuditLog({
      actorEmail: perm.adminEmail,
      action: "user.update",
      targetId: id,
      metadata: updates,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin users PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermissionFromRequest(request, "*")
  if (!perm.ok) return NextResponse.json({ error: "Only super admins can delete users" }, { status: 403 })

  try {
    const { id } = await params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid user id required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const targetEmail = String(user.email || "").trim().toLowerCase()
    const actorEmail = String(perm.adminEmail || "").trim().toLowerCase()
    if (targetEmail && targetEmail === actorEmail) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    const allowlisted = getAllowlistedAdmins()
    if (targetEmail && allowlisted.includes(targetEmail)) {
      return NextResponse.json({ error: "Cannot delete a super admin account" }, { status: 403 })
    }

    await db.collection("users").deleteOne({ _id: new ObjectId(id) })
    await db.collection("orders").deleteMany({ userId: new ObjectId(id) })
    await db.collection("email_verifications").deleteMany({ userId: new ObjectId(id) })
    await db.collection("admin_invites").deleteMany({ userId: new ObjectId(id) })
    await db.collection("admin_login_otps").deleteMany({ email: { $regex: `^${targetEmail}$`, $options: "i" } })
    await db.collection("admin_login_sessions").deleteMany({ email: { $regex: `^${targetEmail}$`, $options: "i" } })

    await writeAuditLog({
      actorEmail: perm.adminEmail,
      action: "user.delete",
      targetId: id,
      targetEmail: targetEmail || undefined,
      metadata: {
        deletedCollections: ["users", "orders", "email_verifications", "admin_invites", "admin_login_otps", "admin_login_sessions"],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin users DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
