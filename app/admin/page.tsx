"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../context/AuthContext"
import Image from "next/image"
import Link from "next/link"

type TopProduct = {
  id: string
  name: string
  image: string
  quantitySold: number
  revenue: number
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usersCount, setUsersCount] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])

  const isAdmin = useMemo(() => {
    if (!user?.email) return false
    const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    return allow.includes(user.email.toLowerCase())
  }, [user?.email])

  useEffect(() => {
    if (isLoading) return
    if (!isAdmin) return
    const run = async () => {
      try {
        const res = await fetch("/api/admin/analytics", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch analytics")
        const data = await res.json()
        setUsersCount(data.usersCount || 0)
        setTotalOrders(data.totalOrders || 0)
        setTotalRevenue(data.totalRevenue || 0)
        setTopProducts(data.topProducts || [])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load analytics"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [isLoading, isAdmin])

  if (isLoading) {
    return <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">Loading...</div>
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center gap-3">
        <p className="text-lg">Access denied</p>
        <Link href="/" className="text-[#CA6F86] underline">Go home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-semibold text-[#16161A] mb-6">Admin Analytics</h1>

      {loading ? (
        <div>Loading analytics...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">Registered Users</p>
              <p className="text-3xl font-bold">{usersCount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold">{totalOrders.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold">₦{totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Top Products */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Most Purchased Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow p-4 flex gap-3 items-center">
                  <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100">
                    {p.image && (
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-gray-600">Sold: {p.quantitySold.toLocaleString()}</p>
                    <p className="text-sm text-gray-800">Revenue: ₦{p.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory CTA */}
          <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-2">Inventory</h2>
            <p className="text-sm text-gray-600 mb-4">Add or update products to sync with the shop.</p>
            <Link href="/admin/inventory" className="underline text-[#2C2C2C]">Open Inventory Manager</Link>
          </div>
        </div>
      )}
    </div>
  )
}


