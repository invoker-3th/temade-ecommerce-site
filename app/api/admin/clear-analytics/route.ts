import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function DELETE(request: Request) {
  const perm = await requirePermissionFromRequest(request, "site:analytics:manage")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const db = await getDatabase()
    const ordersCol = db.collection("orders")

    // Delete all orders - this will reset:
    // - Total orders count
    // - Total revenue
    // - Most purchased products
    const result = await ordersCol.deleteMany({})

    return NextResponse.json({
      success: true,
      message: "Analytics data cleared successfully",
      deletedCount: result.deletedCount,
    })
  } catch (err) {
    console.error("Clear analytics error", err)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}

