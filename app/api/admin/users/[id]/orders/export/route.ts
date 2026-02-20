import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function escapeCsv(value: string) {
  if (value.includes("\"") || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`
  }
  return value
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const orders = await db
      .collection("orders")
      .find({ userId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray()

    const header = [
      "orderId",
      "createdAt",
      "total",
      "currency",
      "paymentStatus",
      "orderStatus",
      "paymentMethod",
      "deliveryName",
      "deliveryEmail",
      "deliveryPhone",
      "deliveryAddress",
      "deliveryCity",
      "deliveryState",
      "items",
    ]

    const rows = orders.map((order) => {
      const items = Array.isArray(order.items)
        ? order.items
            .map((item: { name?: string; quantity?: number; color?: string; size?: string }) => {
              const itemName = item.name || "Item"
              const qty = item.quantity || 1
              const color = item.color || "-"
              const size = item.size || "-"
              return `${itemName} x${qty} (${color}/${size})`
            })
            .join(" | ")
        : ""

      const values = [
        String(order._id || ""),
        order.createdAt ? new Date(order.createdAt).toISOString() : "",
        String(order.total || 0),
        String(order.currency || ""),
        String(order.paymentStatus || ""),
        String(order.orderStatus || ""),
        String(order.paymentMethod || ""),
        String(order.shippingAddress?.userName || ""),
        String(order.shippingAddress?.email || ""),
        String(order.shippingAddress?.phone || ""),
        String(order.shippingAddress?.address || ""),
        String(order.shippingAddress?.city || ""),
        String(order.shippingAddress?.state || ""),
        items,
      ]

      return values.map((v) => escapeCsv(v)).join(",")
    })

    const csv = [header.join(","), ...rows].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=user-orders.csv",
      },
    })
  } catch (error) {
    console.error("Admin user orders export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
