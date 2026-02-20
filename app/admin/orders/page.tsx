"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

type OrderItem = {
  name: string
  image?: string
  price: number
  quantity: number
  color?: string
  size?: string
}

type Order = {
  _id: string
  userId?: string
  items: OrderItem[]
  shippingAddress: { userName: string; email: string; phone: string; city: string; state: string; address: string }
  paymentStatus: string
  orderStatus: string
  paymentReference?: string
  paymentDate?: string
  paymentProviderStatus?: string
  paymentGatewayResponse?: string
  paymentChannel?: string
  total: number
  currency?: "NGN" | "USD" | "GBP"
  shipment?: { etaDays?: number; etaAt?: string; shippedAt?: string; reminderSentAt?: string | null }
  invoice?: {
    number: string
    payment: { method: string; reference?: string }
  }
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUserId, setFilterUserId] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const [shipTargetId, setShipTargetId] = useState<string | null>(null)
  const [etaDaysInput, setEtaDaysInput] = useState("3")

  const orderIdParam = useMemo(() => searchParams.get("orderId") || "", [searchParams])

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterUserId) params.set("userId", filterUserId)
    if (orderIdParam) params.set("orderId", orderIdParam)
    const qs = params.toString() ? `?${params.toString()}` : ""
    const res = await fetch(`/api/admin/orders${qs}`, { cache: "no-store" })
    const data = await res.json()
    setOrders(data.orders || [])
    if (orderIdParam && data.orders?.length) {
      setOpenId(data.orders[0]._id)
    }
  }, [filterUserId, orderIdParam])

  const verifyPendingAndReminders = useCallback(async () => {
    await fetch("/api/admin/orders/verify-pending", { method: "POST" })
    await fetch("/api/admin/orders/process-reminders", { method: "POST" })
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        await verifyPendingAndReminders()
        await loadOrders()
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [loadOrders, verifyPendingAndReminders])

  useEffect(() => {
    const timer = setInterval(() => {
      verifyPendingAndReminders().catch(() => null)
    }, 30000)
    return () => clearInterval(timer)
  }, [verifyPendingAndReminders])

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Orders</h1>
        <Link href="/admin" className="underline font-bold text-[#2C2C2C]">Back to Dashboard</Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-600">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Total Orders: <span className="font-bold">{orders.length}</span></div>
            <div className="flex items-center gap-2">
              <input
                className="border rounded px-2 py-1"
                placeholder="Filter by User ID"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
              />
              <button className="px-3 py-1 border rounded" onClick={() => setFilterUserId("")}>Clear</button>
            </div>
          </div>

          {orders.map((o) => (
            <div key={o._id} className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Order</p>
                  <p className="font-bold text-[#16161A]">{o.invoice?.number || o._id}</p>
                  {o.userId && <p className="text-xs text-gray-500">User ID: {o.userId}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-bold text-[#16161A]">{o.currency || "NGN"} {o.total.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
                <div className="text-sm text-gray-700">
                  Status: <span className="font-semibold">{o.orderStatus}</span> • Payment: <span className="font-semibold">{o.paymentStatus}</span>
                </div>

                <div className="flex items-center gap-2">
                  {(["pending", "processing", "delivered", "cancelled"] as const).map((s) => (
                    <button
                      key={s}
                      className={`px-2 py-1 rounded border ${o.orderStatus === s ? "bg-[#CA6F86] text-white" : "bg-white"}`}
                      onClick={async () => {
                        await fetch("/api/admin/orders", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderId: o._id, status: s }),
                        })
                        await loadOrders()
                      }}
                    >
                      {s}
                    </button>
                  ))}

                  <button
                    className={`px-2 py-1 rounded border ${o.orderStatus === "shipped" ? "bg-[#CA6F86] text-white" : "bg-white"}`}
                    onClick={() => {
                      setShipTargetId(o._id)
                      setEtaDaysInput(o.shipment?.etaDays ? String(o.shipment.etaDays) : "3")
                    }}
                  >
                    shipped
                  </button>

                  <button
                    className="px-2 py-1 rounded border bg-white"
                    onClick={async () => {
                      if (!o.paymentReference) {
                        alert("No payment reference found yet for this order.")
                        return
                      }
                      await fetch("/api/paystack/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reference: o.paymentReference, orderId: o._id }),
                      })
                      await loadOrders()
                    }}
                  >
                    Verify transaction
                  </button>
                </div>
              </div>

              {shipTargetId === o._id && (
                <div className="mt-3 rounded-lg border border-[#EEE7DA] p-3 bg-[#FBF7F3]">
                  <p className="text-sm mb-2">How long until this order arrives? (days)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className="border rounded px-2 py-1 w-24"
                      value={etaDaysInput}
                      onChange={(e) => setEtaDaysInput(e.target.value)}
                    />
                    <button
                      className="px-3 py-1 rounded bg-[#8D2741] text-white"
                      onClick={async () => {
                        await fetch("/api/admin/orders/ship", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderId: o._id, etaDays: Number(etaDaysInput || 3) }),
                        })
                        setShipTargetId(null)
                        await loadOrders()
                      }}
                    >
                      Confirm ship
                    </button>
                    <button className="px-3 py-1 rounded border" onClick={() => setShipTargetId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <button className="text-sm underline" onClick={() => setOpenId(openId === o._id ? null : o._id)}>
                  {openId === o._id ? "Hide details" : "View details"}
                </button>
              </div>

              {openId === o._id && (
                <div className="mt-4 border-t pt-4 grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Customer</p>
                    <p>Name: {o.shippingAddress.userName}</p>
                    <p>Email: {o.shippingAddress.email}</p>
                    <p>Phone: {o.shippingAddress.phone}</p>
                    <p className="mt-2">Delivery Address: {o.shippingAddress.address}, {o.shippingAddress.city}, {o.shippingAddress.state}</p>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">Payment</p>
                    <p>Method: {o.invoice?.payment.method || "paystack"}</p>
                    <p>Reference: {o.paymentReference || o.invoice?.payment.reference || "-"}</p>
                    <p>Provider Status: {o.paymentProviderStatus || "-"}</p>
                    <p>Gateway Response: {o.paymentGatewayResponse || "-"}</p>
                    <p>Channel: {o.paymentChannel || "-"}</p>
                    <p>Transaction Time: {o.paymentDate ? new Date(o.paymentDate).toLocaleString() : "-"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="font-semibold mb-2">Items to ship</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {o.items.map((it, idx) => (
                        <div key={`${o._id}-${idx}`} className="rounded border border-[#EEE7DA] p-2 flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded overflow-hidden bg-gray-100 shrink-0">
                            {it.image ? (
                              <Image src={it.image} alt={it.name} fill className="object-cover" />
                            ) : null}
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold">{it.name}</p>
                            <p>Qty: {it.quantity}</p>
                            <p>{it.color || "-"} / {it.size || "-"}</p>
                            <p>{(it.price * it.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
