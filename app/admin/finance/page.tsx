"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"

type FinanceData = {
  range: { startDate: string; endDate: string }
  totals: {
    revenue: number
    orders: number
    tax: number
    subtotal: number
    refunded: { count: number; revenue: number }
  }
  series: Array<{ date: string; revenue: number; orders: number; tax: number; subtotal: number }>
  currencyBreakdown: Array<{ currency: string; revenue: number; orders: number }>
  statusBreakdown: Array<{ status: string; count: number; revenue: number }>
  recentOrders: Array<{ id: string; total: number; currency: string; orderStatus: string; createdAt: string }>
}

const ranges = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "ytd", label: "YTD" },
]

function buildDateKeys(range: string) {
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
  start.setHours(0, 0, 0, 0)
  const keys: string[] = []
  const cursor = new Date(start)
  while (cursor <= now) {
    keys.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

export default function AdminFinancePage() {
  const { user } = useAuth()
  const adminEmail = user?.email?.trim().toLowerCase() || ""
  const [range, setRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FinanceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminEmail) return
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/finance?range=${range}`, {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        })
        if (!res.ok) throw new Error("Failed to load finance data")
        const payload = await res.json()
        setData(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load finance data")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [adminEmail, range])

  const chartSeries = useMemo(() => {
    if (!data) return []
    const keys = buildDateKeys(range)
    const map = new Map(data.series.map((s) => [s.date, s]))
    return keys.map((key) => map.get(key) || { date: key, revenue: 0, orders: 0, tax: 0, subtotal: 0 })
  }, [data, range])

  const maxRevenue = Math.max(1, ...chartSeries.map((row) => row.revenue))
  const maxOrders = Math.max(1, ...chartSeries.map((row) => row.orders))

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Finance</h1>
          <p className="text-sm text-gray-600">Revenue, refunds, and payouts overview.</p>
        </div>
        <div className="flex items-center gap-2">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-2 text-sm rounded border ${range === r.id ? "bg-[#2C2C2C] text-white border-[#2C2C2C]" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {r.label}
            </button>
          ))}
          <a
            href={`/api/admin/finance?range=${range}&format=csv&email=${encodeURIComponent(adminEmail)}`}
            className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </a>
          <div className="text-xs text-gray-500 ml-2">{data ? `${data.range.startDate} → ${data.range.endDate}` : ""}</div>
        </div>
      </div>

      {loading ? (
        <div>Loading finance data...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue</p>
              <p className="text-2xl font-semibold mt-2">{data?.totals.revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Across {data?.totals.orders.toLocaleString()} orders</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Subtotal</p>
              <p className="text-2xl font-semibold mt-2">{data?.totals.subtotal.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Before tax</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tax</p>
              <p className="text-2xl font-semibold mt-2">{data?.totals.tax.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated tax total</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Cancelled</p>
              <p className="text-2xl font-semibold mt-2">{data?.totals.refunded.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Value: {data?.totals.refunded.revenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue Trend</p>
                <span className="text-xs text-gray-400">Range {range.toUpperCase()}</span>
              </div>
              <div className="h-32 flex items-end gap-1">
                {chartSeries.map((row) => (
                  <div
                    key={`rev-${row.date}`}
                    title={`${row.date}: ${row.revenue.toLocaleString()}`}
                    className="flex-1 bg-[#3F3F3F] rounded-t"
                    style={{ height: `${(row.revenue / maxRevenue) * 100}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Orders Trend</p>
                <span className="text-xs text-gray-400">Range {range.toUpperCase()}</span>
              </div>
              <div className="h-32 flex items-end gap-1">
                {chartSeries.map((row) => (
                  <div
                    key={`ord-${row.date}`}
                    title={`${row.date}: ${row.orders} orders`}
                    className="flex-1 bg-[#707070] rounded-t"
                    style={{ height: `${(row.orders / maxOrders) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Currency Breakdown</p>
              <div className="space-y-3 text-sm text-gray-600">
                {data?.currencyBreakdown.length === 0 ? (
                  <div className="text-sm text-gray-400">No data available.</div>
                ) : (
                  data?.currencyBreakdown.map((row) => (
                    <div key={row.currency} className="flex items-center justify-between border-b pb-2">
                      <span>{row.currency}</span>
                      <span>{row.revenue.toLocaleString()} · {row.orders} orders</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Order Status</p>
              <div className="space-y-3 text-sm text-gray-600">
                {data?.statusBreakdown.length === 0 ? (
                  <div className="text-sm text-gray-400">No data available.</div>
                ) : (
                  data?.statusBreakdown.map((row) => (
                    <div key={row.status} className="flex items-center justify-between border-b pb-2">
                      <span>{row.status}</span>
                      <span>{row.count} · {row.revenue.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 mt-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Recent Orders</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">No orders found.</td>
                    </tr>
                  ) : (
                    data?.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="py-2">{order.id}</td>
                        <td className="py-2">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "--"}</td>
                        <td className="py-2">{order.orderStatus}</td>
                        <td className="py-2 text-right">{order.total.toLocaleString()} {order.currency}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
