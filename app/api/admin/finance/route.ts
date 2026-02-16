import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

type OrderRow = {
  _id: unknown
  total?: number
  subtotal?: number
  tax?: number
  currency?: string
  orderStatus?: string
  createdAt?: Date
}

function getDateRange(range: string) {
  const now = new Date()
  let start = new Date(now)
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
      start = new Date(now.getFullYear(), 0, 1)
      break
    default:
      start.setDate(now.getDate() - 29)
  }
  const toDate = (date: Date) => date.toISOString().slice(0, 10)
  return { startDate: toDate(start), endDate: toDate(now), start, end: now }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"
    const format = searchParams.get("format")
    const { startDate, endDate, start, end } = getDateRange(range)

    const db = await getDatabase()
    const ordersCol = db.collection<OrderRow>("orders")

    const match = { createdAt: { $gte: start, $lte: end } }

    const [series, currencyBreakdown, statusBreakdown, totals, recentOrders] = await Promise.all([
      ordersCol
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
              tax: { $sum: "$tax" },
              subtotal: { $sum: "$subtotal" },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      ordersCol
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: "$currency",
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { revenue: -1 } },
        ])
        .toArray(),
      ordersCol
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: "$orderStatus",
              count: { $sum: 1 },
              revenue: { $sum: "$total" },
            },
          },
        ])
        .toArray(),
      ordersCol
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
              tax: { $sum: "$tax" },
              subtotal: { $sum: "$subtotal" },
            },
          },
        ])
        .toArray(),
      ordersCol
        .find(match, { projection: { total: 1, currency: 1, orderStatus: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
    ])

    const totalsRow = totals[0] || { revenue: 0, orders: 0, tax: 0, subtotal: 0 }

    const cancelled = statusBreakdown.find((s) => s._id === "cancelled")
    const refunded = {
      count: cancelled?.count || 0,
      revenue: cancelled?.revenue || 0,
    }

    const payload = {
      range: { startDate, endDate },
      totals: {
        revenue: totalsRow.revenue || 0,
        orders: totalsRow.orders || 0,
        tax: totalsRow.tax || 0,
        subtotal: totalsRow.subtotal || 0,
        refunded,
      },
      series: (series || []).map((row) => ({
        date: row._id,
        revenue: row.revenue || 0,
        orders: row.orders || 0,
        tax: row.tax || 0,
        subtotal: row.subtotal || 0,
      })),
      currencyBreakdown: (currencyBreakdown || []).map((row) => ({
        currency: row._id || "NGN",
        revenue: row.revenue || 0,
        orders: row.orders || 0,
      })),
      statusBreakdown: (statusBreakdown || []).map((row) => ({
        status: row._id || "unknown",
        count: row.count || 0,
        revenue: row.revenue || 0,
      })),
      recentOrders: (recentOrders || []).map((row) => ({
        id: String(row._id),
        total: row.total || 0,
        currency: row.currency || "NGN",
        orderStatus: row.orderStatus || "unknown",
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
      })),
    }

    if (format === "csv") {
      const header = [
        "date",
        "orders",
        "revenue",
        "tax",
        "subtotal",
        "currency",
        "status",
      ]
      const rows = payload.series.map((row) =>
        [
          row.date,
          row.orders,
          row.revenue,
          row.tax,
          row.subtotal,
          "",
          "",
        ].join(",")
      )
      const currencyRows = payload.currencyBreakdown.map((row) =>
        [
          "",
          row.orders,
          row.revenue,
          "",
          "",
          row.currency,
          "",
        ].join(",")
      )
      const statusRows = payload.statusBreakdown.map((row) =>
        [
          "",
          row.count,
          row.revenue,
          "",
          "",
          "",
          row.status,
        ].join(",")
      )
      const csv = [
        header.join(","),
        ...rows,
        "",
        "Currency Breakdown",
        ...currencyRows,
        "",
        "Status Breakdown",
        ...statusRows,
      ].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=finance-${range}.csv`,
        },
      })
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Admin finance GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
