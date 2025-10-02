"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Order } from "../data/orders" // keep the type definition

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/orders`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch orders")
        }

        const data = await res.json()
        setOrders(data.orders || []) // ✅ your API returns { orders: [...] }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Something went wrong")
        }
      }
    }

    fetchOrders()
  }, [])

  if (loading) {
    return <p className="p-6 text-center">Loading your orders...</p>
  }

  if (error) {
    return <p className="p-6 text-red-600">Error: {error}</p>
  }

  return (
    <div>
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
                <th className="p-3 text-left">Order No</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                // adapt if your API returns items instead of single product
                const total = order.price * order.quantity

                return (
                  <tr key={order.id} className="border-t text-sm md:text-base">
                    <td className="p-3">{order.id}</td>
                    <td className="p-3">{order.date}</td>
                    <td className="p-3">₦{total.toLocaleString()}</td>
                    <td
                      className={`p-3 font-medium capitalize ${order.status === "delivered"
                          ? "text-green-600"
                          : order.status === "pending"
                            ? "text-yellow-600"
                            : order.status === "shipped"
                              ? "text-blue-600"
                              : "text-red-600"
                        }`}
                    >
                      {order.status}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex underline items-center gap-2 px-3 py-1 text-sm text-[#8D2741] transition text-[16px] font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
