import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

function escapeCsv(value: string) {
  if (value.includes("\"") || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`
  }
  return value
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()

    const db = await getDatabase()
    const usersCol = db.collection("users")
    const ordersCol = db.collection("orders")

    const filter: Record<string, unknown> = {}
    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { userName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { "address.city": { $regex: q, $options: "i" } },
        { "address.state": { $regex: q, $options: "i" } },
      ]
    }

    const users = await usersCol
      .find(filter, { projection: { cart: 0, wishlist: 0 } })
      .sort({ createdAt: -1 })
      .toArray()

    const userIds = users.map((u) => u._id).filter(Boolean)
    const stats = userIds.length
      ? await ordersCol
          .aggregate([
            { $match: { userId: { $in: userIds } } },
            {
              $group: {
                _id: "$userId",
                orders: { $sum: 1 },
                revenue: { $sum: "$total" },
                lastOrderAt: { $max: "$createdAt" },
              },
            },
          ])
          .toArray()
      : []

    const statsMap = new Map(stats.map((row) => [String(row._id), row]))

    const header = [
      "id",
      "email",
      "userName",
      "phone",
      "role",
      "disabled",
      "orders",
      "revenue",
      "lastOrderAt",
      "createdAt",
      "updatedAt",
      "city",
      "state",
      "country",
    ]

    const rows = users.map((user) => {
      const stat = statsMap.get(String(user._id))
      const values = [
        String(user._id),
        user.email || "",
        user.userName || "",
        user.phone || "",
        user.role || "customer",
        String(Boolean(user.disabled)),
        String(stat?.orders || 0),
        String(stat?.revenue || 0),
        stat?.lastOrderAt ? new Date(stat.lastOrderAt).toISOString() : "",
        user.createdAt ? new Date(user.createdAt).toISOString() : "",
        user.updatedAt ? new Date(user.updatedAt).toISOString() : "",
        user.address?.city || "",
        user.address?.state || "",
        user.address?.country || "",
      ]
      return values.map((v) => escapeCsv(String(v))).join(",")
    })

    const csv = [header.join(","), ...rows].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=users.csv",
      },
    })
  } catch (error) {
    console.error("Admin users export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
