import { NextResponse } from "next/server"
import { getPermissionsForUser } from "@/lib/server/permissionGuard"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const { user, permissions, roles } = await getPermissionsForUser(email)
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 })

  return NextResponse.json({ user: { email: user.email, userName: user.userName, role: user.role, roles: user.roles || [] }, permissions, roles })
}
