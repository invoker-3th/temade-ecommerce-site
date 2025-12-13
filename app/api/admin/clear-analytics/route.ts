import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function DELETE() {
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

