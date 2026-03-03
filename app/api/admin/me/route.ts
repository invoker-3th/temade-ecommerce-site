import { NextResponse } from "next/server"
import { getPermissionsForUser } from "@/lib/server/permissionGuard"
import { requireAdminFromRequest } from "@/lib/server/adminGuard"
import { getAdminSessionFromRequest } from "@/lib/server/sessionAuth"

export async function GET(request: Request) {
  const session = await getAdminSessionFromRequest(request)
  if (!session?.email) return NextResponse.json({ error: "Missing admin identity" }, { status: 401 })

  const sessionEmail = String(session.email).trim().toLowerCase()
  const url = new URL(request.url)
  const requestedEmail = String(url.searchParams.get("email") || "").trim().toLowerCase()
  const email = requestedEmail || sessionEmail
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  // Only strict admins can query identity data for other accounts.
  if (email !== sessionEmail) {
    const admin = await requireAdminFromRequest(request)
    if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  const { user, permissions, roles } = await getPermissionsForUser(email)
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 })

  const userWithExtras = user as {
    fullName?: unknown
    roles?: unknown
  }

  return NextResponse.json({
    user: {
      email: user.email,
      userName: user.userName,
      fullName: typeof userWithExtras.fullName === "string" ? userWithExtras.fullName : undefined,
      role: user.role,
      roles: Array.isArray(userWithExtras.roles) ? userWithExtras.roles.map((r) => String(r)) : [],
    },
    permissions,
    roles,
  })
}
