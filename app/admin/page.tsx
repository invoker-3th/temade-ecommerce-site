"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import AdminNotifications from "../components/AdminNotifications"

type TopProduct = {
  id: string
  name: string
  image: string
  quantitySold: number
  revenue: number
}

type SeriesPoint = {
  date: string
  orders: number
  revenue: number
}

const ranges = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "ytd", label: "YTD" },
]

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

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
    keys.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usersCount, setUsersCount] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [currencyBreakdown, setCurrencyBreakdown] = useState({
    NGN: { orders: 0, revenue: 0 },
    USD: { orders: 0, revenue: 0 },
    EUR: { orders: 0, revenue: 0 },
    GBP: { orders: 0, revenue: 0 },
  })
  const [range, setRange] = useState("30d")
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [clearing, setClearing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/analytics?range=${encodeURIComponent(range)}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch analytics")
        const data = await res.json()
        setUsersCount(data.usersCount || 0)
        setTotalOrders(data.totalOrders || 0)
        setTotalRevenue(data.totalRevenue || 0)
        setTotalProducts(data.totalProducts || 0)
        setTopProducts(data.topProducts || [])
        setCurrencyBreakdown(data.currencyBreakdown || {
          NGN: { orders: 0, revenue: 0 },
          USD: { orders: 0, revenue: 0 },
          EUR: { orders: 0, revenue: 0 },
          GBP: { orders: 0, revenue: 0 },
        })
        setSeries(data.ordersByDay || [])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load analytics"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [range])

  const chartSeries = useMemo(() => {
    const keys = buildDateKeys(range)
    const map = new Map(series.map((s) => [s.date, s]))
    return keys.map((k) => map.get(k) || { date: k, orders: 0, revenue: 0 })
  }, [range, series])

  const maxOrders = Math.max(1, ...chartSeries.map((d) => d.orders))
  const maxRevenue = Math.max(1, ...chartSeries.map((d) => d.revenue))

  const handleClearAnalytics = async () => {
    setClearing(true)
    try {
      const res = await fetch("/api/admin/clear-analytics", {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to clear analytics")
      const data = await res.json()

      setTotalOrders(0)
      setTotalRevenue(0)
      setTopProducts([])

      setShowConfirmDialog(false)
      alert(`Analytics cleared successfully. Deleted ${data.deletedCount} orders.`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to clear analytics"
      alert(`Error: ${msg}`)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Performance snapshot for the selected time range.</p>
        </div>
        <div className="flex items-center gap-2">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-2 text-sm rounded border ${range === r.id ? "bg-[#CA6F86] text-white border-[#CA6F86]" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={clearing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
          >
            {clearing ? "Clearing..." : "Clear Analytics"}
          </button>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#16161A] mb-4">Confirm Clear Analytics</h2>
            <p className="text-gray-700 mb-6">
              This will permanently delete all orders, which will reset:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Total Orders</li>
                <li>Total Revenue</li>
                <li>Most Purchased Products</li>
                <li>All order history</li>
              </ul>
              <strong className="text-red-600">This action cannot be undone.</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={clearing}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAnalytics}
                disabled={clearing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
              >
                {clearing ? "Clearing..." : "Yes, Clear All Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div>Loading analytics...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm font-semibold text-gray-600">Registered Users</p>
              <p className="text-3xl font-bold text-[#16161A]">{usersCount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm font-semibold text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-[#16161A]">{totalOrders.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm font-semibold text-gray-600">Total Revenue (NGN)</p>
              <p className="text-3xl font-bold text-[#16161A]">{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm font-semibold text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-[#16161A]">{totalProducts.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#16161A]">Orders Over Time</h2>
                <span className="text-xs text-gray-500">{range.toUpperCase()}</span>
              </div>
              <div className="h-32 flex items-end gap-1">
                {chartSeries.map((point) => (
                  <div
                    key={point.date}
                    title={`${point.date}: ${point.orders} orders`}
                    className="flex-1 bg-[#CA6F86] rounded-t"
                    style={{ height: `${(point.orders / maxOrders) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#16161A]">Revenue Over Time</h2>
                <span className="text-xs text-gray-500">{range.toUpperCase()}</span>
              </div>
              <div className="h-32 flex items-end gap-1">
                {chartSeries.map((point) => (
                  <div
                    key={point.date}
                    title={`${point.date}: ${point.revenue.toLocaleString()} NGN`}
                    className="flex-1 bg-[#2C2C2C] rounded-t"
                    style={{ height: `${(point.revenue / maxRevenue) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <AdminNotifications />

          <div>
            <h2 className="text-xl font-bold mb-3 text-[#16161A]">Revenue by Currency</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600">NGN</p>
                <p className="text-2xl font-bold text-[#16161A]">{currencyBreakdown.NGN.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{currencyBreakdown.NGN.orders} orders</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600">USD</p>
                <p className="text-2xl font-bold text-[#16161A]">${currencyBreakdown.USD.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{currencyBreakdown.USD.orders} orders</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600">EUR</p>
                <p className="text-2xl font-bold text-[#16161A]">{currencyBreakdown.EUR.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{currencyBreakdown.EUR.orders} orders</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600">GBP</p>
                <p className="text-2xl font-bold text-[#16161A]">{currencyBreakdown.GBP.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{currencyBreakdown.GBP.orders} orders</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3 text-[#16161A]">Most Purchased Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow p-4 flex gap-3 items-center">
                  <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100">
                    {p.image && (
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#16161A]">{p.name}</p>
                    <p className="text-sm font-semibold text-gray-600">Sold: {p.quantitySold.toLocaleString()}</p>
                    <p className="text-sm font-bold text-gray-800">Revenue: {p.revenue.toLocaleString()} NGN</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 text-[#16161A]">Inventory</h2>
              <p className="text-sm font-semibold text-gray-600">Add or update products to sync with the shop.</p>
              <Link href="/admin/inventory" className="underline font-bold text-[#2C2C2C] mt-3 inline-block">Open Inventory Manager</Link>
            </div>
            <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 text-[#16161A]">Orders</h2>
              <p className="text-sm font-semibold text-gray-600">Track paid orders and invoices for shipping.</p>
              <Link href="/admin/orders" className="underline font-bold text-[#2C2C2C] mt-3 inline-block">View Orders</Link>
            </div>
            <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 text-[#16161A]">Lookbook</h2>
              <p className="text-sm font-semibold text-gray-600">Add or remove lookbook images hosted on Cloudinary.</p>
              <Link href="/admin/lookbook" className="underline font-bold text-[#2C2C2C] mt-3 inline-block">Open Lookbook Manager</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
