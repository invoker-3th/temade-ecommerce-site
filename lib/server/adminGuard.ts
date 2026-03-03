import { getDatabase } from "@/lib/mongodb"
import { getAdminSessionFromRequest } from "@/lib/server/sessionAuth"
import { isAllowlistedAdmin } from "@/lib/server/adminAllowlist"

function allowLegacyIdentityFallback() {
  if (process.env.NODE_ENV === "production") return false
  return process.env.ALLOW_ADMIN_EMAIL_FALLBACK === "true"
}

export async function requireAdminFromRequest(request: Request) {
  const session = await getAdminSessionFromRequest(request)
  const sessionEmail = String(session?.email || "").trim().toLowerCase()

  const adminEmail = sessionEmail || (
    allowLegacyIdentityFallback()
      ? String(request.headers.get("x-admin-email") || "").trim().toLowerCase()
      : ""
  )
  if (!adminEmail) return { ok: false as const, status: 401, error: "Missing admin identity" }

  const db = await getDatabase()
  const user = await db.collection("users").findOne({ email: { $regex: `^${adminEmail}$`, $options: "i" } })
  const isAdmin = Boolean(isAllowlistedAdmin(adminEmail))
  if (!isAdmin) return { ok: false as const, status: 403, error: "Admin access required" }

  return { ok: true as const, adminEmail, userId: user?._id ? String(user._id) : "" }
}
