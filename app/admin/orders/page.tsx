"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Order = {
  _id: string
  userId: string
  items: Array<{ name: string; image?: string; price: number; quantity: number; color?: string; size?: string }>
  shippingAddress: { userName: string; email: string; phone: string; city: string; state: string; address: string }
  paymentStatus: string
  orderStatus: string
  total: number
  invoice?: {
    number: string
    issuedAt: string
    items: Array<{ name: string; color?: string; size?: string; price: number; quantity: number; total: number }>
    subtotal: number
    tax: number
    shipping: number
    total: number
    shippingAddress: Order["shippingAddress"]
    customer: { name: string; email: string; phone: string }
    payment: { method: string; reference?: string }
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUserId, setFilterUserId] = useState<string>("")
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const qs = filterUserId ? `?userId=${encodeURIComponent(filterUserId)}` : ""
        const res = await fetch(`/api/admin/orders${qs}`, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filterUserId])

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
              <input className="border rounded px-2 py-1" placeholder="Filter by User ID" value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} />
              <button className="px-3 py-1 border rounded" onClick={() => setFilterUserId("")}>Clear</button>
            </div>
          </div>
          {orders.map((o) => (
            <div key={o._id} className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Order</p>
                  <p className="font-bold text-[#16161A]">{o.invoice?.number || o._id}</p>
                  {o?.userId && (
                    <p className="text-xs text-gray-500">User ID: {o.userId}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-bold text-[#16161A]">₦{o.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">Status: <span className="font-semibold">{o.orderStatus}</span> • Payment: <span className="font-semibold">{o.paymentStatus}</span></div>
                <div className="flex items-center gap-2">
                  {(["pending","processing","shipped","delivered","cancelled"] as const).map((s) => {
                    const disabled = s === 'pending' || s === 'processing'
                    return (
                      <button
                        key={s}
                        disabled={disabled}
                        className={`px-2 py-1 rounded border ${o.orderStatus===s? 'bg-[#CA6F86] text-white':'bg-white'} ${disabled? 'opacity-50 cursor-not-allowed':''}`}
                        onClick={async () => {
                          if (disabled) return
                          await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ orderId: o._id, status: s }) })
                          const qs = filterUserId ? `?userId=${encodeURIComponent(filterUserId)}` : ""
                          const res = await fetch(`/api/admin/orders${qs}`, { cache: "no-store" })
                          const data = await res.json(); setOrders(data.orders || [])
                        }}
                      >{s}</button>
                    )
                  })}
                </div>
              </div>
              <div className="mt-3">
                <button className="text-sm underline" onClick={() => setOpenId(openId===o._id? null : o._id)}>
                  {openId===o._id? 'Hide details' : 'View details'}
                </button>
              </div>
              {openId===o._id && (
                <div className="mt-4 border-t pt-4 grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Customer</p>
                    <p>Name: {o.invoice?.customer?.name || o.shippingAddress.userName}</p>
                    <p>Email: {o.invoice?.customer?.email || o.shippingAddress.email}</p>
                    <p>Phone: {o.invoice?.customer?.phone || o.shippingAddress.phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Delivery Address</p>
                    <p>{o.shippingAddress.address}</p>
                    <p>{o.shippingAddress.city}, {o.shippingAddress.state}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Payment</p>
                    <p>Method: {o.invoice?.payment.method || 'paystack'}</p>
                    <p>Reference: {o.invoice?.payment.reference || '-'}</p>
                    <p>Status: {o.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Items</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {o.items.map((it, idx) => (
                        <li key={idx}>{it.name} × {it.quantity} — ₦{(it.price * it.quantity).toLocaleString()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {o.invoice && (
                <div className="mt-4 border-t pt-4">
                  <p className="font-semibold mb-2">Invoice</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Ship To</p>
                      <p className="font-medium">{o.invoice.shippingAddress.address}, {o.invoice.shippingAddress.city}, {o.invoice.shippingAddress.state}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment</p>
                      <p className="font-medium">{o.invoice.payment.method} {o.invoice.payment.reference ? `(Ref: ${o.invoice.payment.reference})` : ''}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="py-1">Item</th>
                          <th className="py-1">Color</th>
                          <th className="py-1">Size</th>
                          <th className="py-1">Qty</th>
                          <th className="py-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.invoice.items.map((it, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-1">{it.name}</td>
                            <td className="py-1">{it.color || '-'}</td>
                            <td className="py-1">{it.size || '-'}</td>
                            <td className="py-1">{it.quantity}</td>
                            <td className="py-1 text-right">₦{it.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 text-right space-y-1">
                      <p>Subtotal: ₦{o.invoice.subtotal.toLocaleString()}</p>
                      <p>Tax: ₦{o.invoice.tax.toLocaleString()}</p>
                      <p>Shipping: ₦{o.invoice.shipping.toLocaleString()}</p>
                      <p className="font-bold">Total: ₦{o.invoice.total.toLocaleString()}</p>
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


