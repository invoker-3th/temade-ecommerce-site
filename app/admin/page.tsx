"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useAuth } from "@/app/context/AuthContext"
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

const currencyColors = ["#8D2741", "#2C2C2C", "#CA6F86", "#DFA4B2"]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const adminEmail = user?.email?.trim().toLowerCase() || ""
  const [permissions, setPermissions] = useState<string[] | null>(null)

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

  const hasPermission = (permission: string) =>
    Array.isArray(permissions) && (permissions.includes("*") || permissions.includes(permission))

  const canViewAnalytics = hasPermission("site:analytics:view")
  const canManageAnalytics = hasPermission("site:analytics:manage")
  const canViewOrders = hasPermission("orders:view")
  const canViewCatalog = hasPermission("catalog:view") || hasPermission("catalog:edit")
  const canEditLookbook = hasPermission("lookbook:edit")

  useEffect(() => {
    if (!adminEmail) return
    const loadPermissions = async () => {
      try {
        const res = await fetch(`/api/admin/me?email=${encodeURIComponent(adminEmail)}`, {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        })
        if (!res.ok) {
          setPermissions([])
          return
        }
        const data = await res.json()
        setPermissions(Array.isArray(data?.permissions) ? data.permissions : [])
      } catch {
        setPermissions([])
      }
    }
    loadPermissions()
  }, [adminEmail])

  useEffect(() => {
    if (!adminEmail || permissions === null) return
    if (!canViewAnalytics) {
      setLoading(false)
      setError(null)
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/analytics?range=${encodeURIComponent(range)}`, {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        })
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
  }, [adminEmail, canViewAnalytics, permissions, range])

  const chartSeries = useMemo(() => {
    const keys = buildDateKeys(range)
    const map = new Map(series.map((s) => [s.date, s]))
    return keys.map((k) => map.get(k) || { date: k, orders: 0, revenue: 0 })
  }, [range, series])

  const currencyChart = useMemo(
    () => [
      { name: "NGN", value: currencyBreakdown.NGN.revenue, orders: currencyBreakdown.NGN.orders },
      { name: "USD", value: currencyBreakdown.USD.revenue, orders: currencyBreakdown.USD.orders },
      { name: "EUR", value: currencyBreakdown.EUR.revenue, orders: currencyBreakdown.EUR.orders },
      { name: "GBP", value: currencyBreakdown.GBP.revenue, orders: currencyBreakdown.GBP.orders },
    ],
    [currencyBreakdown]
  )

  const topProductChart = useMemo(
    () =>
      topProducts.slice(0, 6).map((p) => ({
        name: p.name.length > 16 ? `${p.name.slice(0, 16)}...` : p.name,
        sold: p.quantitySold,
      })),
    [topProducts]
  )

  const handleClearAnalytics = async () => {
    if (!adminEmail || !canManageAnalytics) return
    setClearing(true)
    try {
      const res = await fetch("/api/admin/clear-analytics", {
        method: "DELETE",
        headers: { "x-admin-email": adminEmail },
      })
      if (!res.ok) throw new Error("Failed to clear analytics")
      const data = await res.json()

      setTotalOrders(0)
      setTotalRevenue(0)
      setTopProducts([])
      setSeries([])

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
          {canManageAnalytics && (
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              {clearing ? "Clearing..." : "Clear Analytics"}
            </button>
          )}
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#16161A] mb-4">Confirm Clear Analytics</h2>
            <p className="text-gray-700 mb-6">
              This will permanently delete all orders, which will reset:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 mb-3 text-gray-700">
              <li>Total Orders</li>
              <li>Total Revenue</li>
              <li>Most Purchased Products</li>
              <li>All order history</li>
            </ul>
            <p className="text-red-600 font-semibold">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end mt-6">
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

      {permissions === null || loading ? (
        <div>Loading analytics...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-8">
          {!canViewAnalytics ? (
            <div className="bg-white rounded-xl shadow p-5 text-sm text-gray-700">
              You do not currently have `site:analytics:view` permission. Use the quick links below for your assigned operations.
            </div>
          ) : (
            <>
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
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEE7DA" />
                    <XAxis dataKey="date" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#CA6F86" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#16161A]">Revenue Trend</h2>
                <span className="text-xs text-gray-500">{range.toUpperCase()}</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEE7DA" />
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#2C2C2C" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-lg font-bold text-[#16161A] mb-4">Revenue by Currency</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currencyChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                    >
                      {currencyChart.map((_, idx) => (
                        <Cell key={`currency-cell-${idx}`} fill={currencyColors[idx % currencyColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-lg font-bold text-[#16161A] mb-4">Top Products (Units Sold)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEE7DA" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={140} />
                    <Tooltip />
                    <Bar dataKey="sold" fill="#8D2741" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
            </>
          )}

          {canViewOrders && <AdminNotifications />}

          {canViewAnalytics && (
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
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {canViewCatalog && (
              <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-2 text-[#16161A]">Inventory</h2>
                <p className="text-sm font-semibold text-gray-600">Add or update products to sync with the shop.</p>
                <Link href="/admin/inventory" className="underline font-bold text-[#2C2C2C] mt-3 inline-block">Open Inventory Manager</Link>
              </div>
            )}
            {canViewOrders && (
              <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-2 text-[#16161A]">Orders</h2>
                <p className="text-sm font-semibold text-gray-600">Track paid orders and invoices for shipping.</p>
                <Link href="/admin/orders" className="underline font-bold text-[#2C2C2C] mt-3 inline-block">View Orders</Link>
              </div>
            )}
            {canEditLookbook && (
              <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-2 text-[#16161A]">Lookbook</h2>
                <p className="text-sm font-semibold text-gray-600">Add or remove lookbook images hosted on Cloudinary.</p>
                <Link href="/admin/lookbook" className="underline font-bold text-[#2C2C2C] mt-3 inline-block">Open Lookbook Manager</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
