import { NextResponse } from "next/server"
import { getPermissionsForUser } from "@/lib/server/permissionGuard"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

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
