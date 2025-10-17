"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import type { Order } from "../../lib/models/User"

export default function OrdersTab() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user?._id) {
          setOrders([])
          setLoading(false)
          return
        }

        const res = await fetch(`/api/orders?userId=${encodeURIComponent(user._id.toString())}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          const errorText = await res.text()
          console.error("Failed to fetch orders:", res.status, errorText)
          throw new Error(`Failed to fetch orders: ${res.status}`)
        }

        const data = await res.json()
        setOrders(data.orders || [])
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Something went wrong")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
    const id = setInterval(fetchOrders, 8000)
    return () => clearInterval(id)
  }, [user?._id])

  if (loading) {
    return <p className="p-6 text-center">Loading your orders...</p>
  }

  if (error) {
    return <p className="p-6 text-red-600">Error: {error}</p>
  }

  const handleRefresh = () => {
    if (user?._id) {
      const fetchOrders = async () => {
        try {
          setLoading(true)
          setError(null)

          const res = await fetch(`/api/orders?userId=${encodeURIComponent(user._id!.toString())}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (!res.ok) {
            const errorText = await res.text()
            console.error("Failed to fetch orders:", res.status, errorText)
            throw new Error(`Failed to fetch orders: ${res.status}`)
          }

          const data = await res.json()
          setOrders(data.orders || [])
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError("Something went wrong")
          }
        } finally {
          setLoading(false)
        }
      }
      fetchOrders()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Your Orders</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-3 py-1 bg-[#8D2741] text-white rounded text-sm hover:bg-[#701d34] disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="rounded-xl p-6">
          <p className="text-[#000000] text-sm mb-4">
            You do not have any orders yet.{" "}
            <Link href="/shop" className="text-[#CA6F86] hover:underline">
              Start shopping!
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border border-[#E3E3E3] bg-[#FFFDF4] text-gray-700 text-sm md:text-base">
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Order Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: Order) => (
                <tr key={o._id?.toString()} className="border-t text-sm md:text-base">
                  <td className="p-3">{o.invoice?.number || o._id?.toString()}</td>
                  <td className="p-3">₦{o.total?.toLocaleString() || '0'}</td>
                  <td className="p-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-xs ${o.paymentStatus==='completed'?'bg-green-100 text-green-800': o.paymentStatus==='failed'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800'}`}>
                      {o.paymentStatus==='completed'?'paid': o.paymentStatus || 'pending'}
                    </span>
                  </td>
                  <td className="p-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-xs ${o.orderStatus==='processing'?'bg-yellow-100 text-yellow-800': o.orderStatus==='shipped'?'bg-blue-100 text-blue-800': o.orderStatus==='delivered'?'bg-green-100 text-green-800': o.orderStatus==='cancelled'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800'}`}>
                      {o.orderStatus || 'pending'}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link href={`/account`} className="inline-flex underline items-center gap-2 px-3 py-1 text-sm text-[#8D2741] transition text-[16px] font-medium">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
