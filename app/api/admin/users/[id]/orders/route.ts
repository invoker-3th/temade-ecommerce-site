import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermissionFromRequest(request, "users:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const { id } = await params
    const db = await getDatabase()
    const ordersCol = db.collection("orders")

    const orders = await ordersCol
      .find({ userId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ orders, count: orders.length })
  } catch (error) {
    console.error("Admin user orders GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
