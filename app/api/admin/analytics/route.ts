import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

function getStartDate(range: string, now: Date) {
  const start = new Date(now)
  switch (range) {
    case "7d":
      start.setDate(now.getDate() - 6)
      break
    case "30d":
      start.setDate(now.getDate() - 29)
      break
    case "90d":
      start.setDate(now.getDate() - 89)
      break
    case "ytd":
      start.setMonth(0, 1)
      break
    default:
      start.setDate(now.getDate() - 29)
  }
  start.setHours(0, 0, 0, 0)
  return start
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"
    const now = new Date()
    const startDate = getStartDate(range, now)

    const db = await getDatabase()

    const usersCol = db.collection("users")
    const ordersCol = db.collection("orders")
    const productsCol = db.collection("products")

    const match = { createdAt: { $gte: startDate, $lte: now } }

    const [usersCount, ordersStats, currencyStats, topProducts, totalProducts, ordersByDay] = await Promise.all([
      usersCol.countDocuments({}),
      ordersCol
        .aggregate([
          { $match: match },
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
          { $match: match },
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
          { $match: match },
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
      productsCol.countDocuments({}),
      ordersCol
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              orders: { $sum: 1 },
              revenue: { $sum: "$total" },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ])

    const totals = ordersStats[0] || { totalOrders: 0, totalRevenue: 0 }

    const currencyBreakdown = {
      NGN: { orders: 0, revenue: 0 },
      USD: { orders: 0, revenue: 0 },
      EUR: { orders: 0, revenue: 0 },
      GBP: { orders: 0, revenue: 0 },
    }

    type CurrencyStat = { _id: string | null; orders: number; revenue: number }
    const typedCurrencyStats = currencyStats as unknown as CurrencyStat[]

    typedCurrencyStats.forEach((stat) => {
      const currency = stat._id || "NGN"
      if (currency in currencyBreakdown) {
        currencyBreakdown[currency as keyof typeof currencyBreakdown] = {
          orders: stat.orders || 0,
          revenue: stat.revenue || 0,
        }
      }
    })

    type AggDoc = { _id: { id: string; name: string; image: string }; quantitySold: number; revenue: number }
    const typedTop = topProducts as unknown as AggDoc[]

    const typedSeries = ordersByDay as unknown as Array<{ _id: string; orders: number; revenue: number }>

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
      ordersByDay: typedSeries.map((p) => ({
        date: p._id,
        orders: p.orders,
        revenue: p.revenue,
      })),
    })
  } catch (err) {
    console.error("Admin analytics error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
