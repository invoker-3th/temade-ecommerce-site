import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function getAllowlistedAdmins() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(/[,\n;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function getPermissionsForUser(userEmail: string) {
  const db = await getDatabase()
  const usersCol = db.collection("users")
  const rolesCol = db.collection("roles")

  const user = await usersCol.findOne({ email: { $regex: `^${userEmail}$`, $options: "i" } })
  if (!user) return { user: null, permissions: [] as string[], roles: [] }

  const allowlisted = getAllowlistedAdmins()
  const isSuper = user.role === "admin" || allowlisted.includes(String(user.email).toLowerCase())
  if (isSuper) return { user, permissions: ["*"], roles: [] }

  const roleIds = Array.isArray(user.roles) ? user.roles : []
  if (roleIds.length === 0) return { user, permissions: [], roles: [] }

  // roleIds might be stored as strings (ObjectId hex) or names; attempt to match both
  // Convert any 24-char hex strings to ObjectId for matching
  const objectIds = roleIds
    .filter((r: unknown) => typeof r === "string" && /^[0-9a-fA-F]{24}$/.test(String(r)))
    .map((s: string) => new ObjectId(s))
  const names = roleIds.filter((r: unknown) => typeof r === "string" && !/^[0-9a-fA-F]{24}$/.test(String(r))) as string[]

  const or: Array<Record<string, unknown>> = []
  if (objectIds.length > 0) or.push({ _id: { $in: objectIds } })
  if (names.length > 0) or.push({ name: { $in: names } })
  if (or.length === 0) return { user, permissions: [], roles: [] }

  const roleDocs = await rolesCol.find({ $or: or }).toArray() as Array<{ permissions?: string[] } & Record<string, unknown>>

  const permissions = roleDocs.reduce((acc: string[], r) => acc.concat((r as { permissions?: string[] }).permissions || []), [] as string[])
  return { user, permissions: Array.from(new Set(permissions)), roles: roleDocs }
}

export async function requirePermissionFromRequest(request: Request, permission: string) {
  const adminEmailHeader = String(request.headers.get("x-admin-email") || "").trim().toLowerCase()
  const url = new URL(request.url)
  const emailQuery = String(url.searchParams.get("email") || "").trim().toLowerCase()
  const email = adminEmailHeader || emailQuery
  if (!email) return { ok: false as const, status: 401, error: "Missing admin identity" }

  try {
    const { user, permissions } = await getPermissionsForUser(email)
    if (!user) return { ok: false as const, status: 403, error: "Admin access required" }
    if (permissions.includes("*") || permissions.includes(permission)) {
      return { ok: true as const, adminEmail: email, userId: user._id ? String(user._id) : "" }
    }
    return { ok: false as const, status: 403, error: "Permission denied" }
  } catch (err) {
    console.error("Permission check error:", err)
    return { ok: false as const, status: 500, error: "Internal error" }
  }
}
