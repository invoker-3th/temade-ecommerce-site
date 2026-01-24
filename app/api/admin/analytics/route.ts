import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()

    const usersCol = db.collection("users")
    const ordersCol = db.collection("orders")
    const productsCol = db.collection("products")

    const [usersCount, ordersStats, currencyStats, topProducts, totalProducts] = await Promise.all([
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
          {
            $group: {
              _id: "$currency",
              orders: { $sum: 1 },
              revenue: { $sum: "$total" },
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

    // Process currency stats
    const currencyBreakdown = {
      NGN: { orders: 0, revenue: 0 },
      USD: { orders: 0, revenue: 0 },
      EUR: { orders: 0, revenue: 0 },
      GBP: { orders: 0, revenue: 0 },
    }
    
    type CurrencyStat = { _id: string | null; orders: number; revenue: number }
    const typedCurrencyStats = currencyStats as unknown as CurrencyStat[]
    
    typedCurrencyStats.forEach((stat) => {
      const currency = stat._id || 'NGN'
      if (currency in currencyBreakdown) {
        currencyBreakdown[currency as keyof typeof currencyBreakdown] = {
          orders: stat.orders || 0,
          revenue: stat.revenue || 0,
        }
      }
    })

    type AggDoc = { _id: { id: string; name: string; image: string }; quantitySold: number; revenue: number }
    const typedTop = topProducts as unknown as AggDoc[]
    
    return NextResponse.json({
      usersCount,
      totalOrders: totals.totalOrders || 0,
      totalRevenue: totals.totalRevenue || 0,
      totalProducts,
      currencyBreakdown,
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


