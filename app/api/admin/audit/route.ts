import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function GET(request: Request) {
  const perm = await requirePermissionFromRequest(request, "admin:audit:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const db = await getDatabase()
    const rows = await db
      .collection("admin_audit_logs")
      .find()
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()
    return NextResponse.json({ logs: rows })
  } catch (err) {
    console.error("Audit GET error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
