import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()

    const usersCol = db.collection("users")
    const ordersCol = db.collection("orders")
    const productsCol = db.collection("products")

    const [usersCount, ordersStats, topProducts, totalProducts] = await Promise.all([
      usersCol.countDocuments({}),
      ordersCol
        .aggregate([
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: "$total" },
            },
          },
        ])
        .toArray(),
      ordersCol
        .aggregate([
          { $unwind: "$items" },
          {
            $group: {
              _id: { id: "$items.id", name: "$items.name", image: "$items.image" },
              quantitySold: { $sum: "$items.quantity" },
              revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            },
          },
          { $sort: { quantitySold: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
      productsCol.countDocuments({})
    ])

    const totals = ordersStats[0] || { totalOrders: 0, totalRevenue: 0 }

    type AggDoc = { _id: { id: string; name: string; image: string }; quantitySold: number; revenue: number }
    const typedTop = topProducts as unknown as AggDoc[]
    
    return NextResponse.json({
      usersCount,
      totalOrders: totals.totalOrders || 0,
      totalRevenue: totals.totalRevenue || 0,
      totalProducts,
      topProducts: typedTop.map((p) => ({
        id: p._id.id,
        name: p._id.name,
        image: p._id.image,
        quantitySold: p.quantitySold,
        revenue: p.revenue,
      })),
    })
  } catch (err) {
    console.error("Admin analytics error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


