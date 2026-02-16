"use client"

import { useEffect, useMemo, useState } from "react"

type UserRow = {
  _id: string
  email: string
  userName: string
  phone?: string
  role?: string
  disabled?: boolean
  createdAt?: string
  updatedAt?: string
  address?: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  orders: number
  revenue: number
  lastOrderAt?: string | null
}

type OrderRow = {
  _id: string
  total: number
  currency: "NGN" | "USD" | "GBP"
  orderStatus: string
  paymentStatus: string
  createdAt: string
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRow[]>([])
  const [count, setCount] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createForm, setCreateForm] = useState({ userName: "", email: "", phone: "" })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const qs = query ? `?q=${encodeURIComponent(query)}` : ""
        const res = await fetch(`/api/admin/users${qs}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load users")
        const data = await res.json()
        setUsers(data.users || [])
        setCount(data.count || 0)
        if (data.users?.length) {
          setSelectedId((current) => current ?? data.users[0]._id)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [query])

  const selected = useMemo(
    () => users.find((u) => u._id === selectedId) || null,
    [users, selectedId]
  )

  useEffect(() => {
    const loadOrders = async () => {
      if (!selectedId) {
        setOrders([])
        return
      }
      setOrdersLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${selectedId}/orders`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load orders")
        const data = await res.json()
        setOrders(data.orders || [])
      } catch (error) {
        console.error(error)
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }
    loadOrders()
  }, [selectedId])

  const updateUser = async (payload: { role?: string; disabled?: boolean }) => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update user")
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedId ? { ...u, ...payload } : u))
      )
    } catch (error) {
      console.error(error)
      alert("Failed to update user")
    } finally {
      setActionLoading(false)
    }
  }

  const createAdmin = async () => {
    setCreateError("")
    if (!createForm.email || !createForm.userName) {
      setCreateError("Email and username are required.")
      return
    }
    setCreateLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create admin")
      }
      setUsers((prev) => [data.user, ...prev])
      setCount((prev) => prev + 1)
      setCreateForm({ userName: "", email: "", phone: "" })
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create admin")
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Users</h1>
          <p className="text-sm text-gray-600">Manage customer accounts and review order activity.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div>Total users: <span className="font-semibold">{count.toLocaleString()}</span></div>
          <a
            href={`/api/admin/users/export${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className="px-3 py-2 text-xs rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 lg:w-5/12">
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Create Admin</p>
            <div className="grid gap-2 text-sm">
              <input
                value={createForm.userName}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, userName: e.target.value }))}
                placeholder="Username"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                value={createForm.phone}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone (optional)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {createError && <div className="text-xs text-red-600">{createError}</div>}
              <button
                onClick={createAdmin}
                disabled={createLoading}
                className="px-3 py-2 text-xs rounded bg-[#8D2741] text-white disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email, name, phone, city"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="bg-white rounded-xl shadow divide-y">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No users found.</div>
            ) : (
              users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => setSelectedId(user._id)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-[#F4EFE7] ${selectedId === user._id ? "bg-[#F4EFE7]" : ""}`}
                >
                  <div className="font-semibold text-[#16161A]">{user.userName || "Unnamed User"}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>Orders: {user.orders}</span>
                    <span>Revenue: {user.revenue.toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-xl shadow p-6">
            {!selected ? (
              <div className="text-sm text-gray-500">Select a user to view details.</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#16161A]">{selected.userName || "Unnamed User"}</h2>
                    <p className="text-sm text-gray-600">{selected.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                    <select
                      value={selected.role || "customer"}
                      onChange={(e) => updateUser({ role: e.target.value })}
                      disabled={actionLoading}
                      className="mt-2 w-full border rounded px-2 py-2 text-sm"
                    >
                      <option value="customer">Customer</option>
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Account Status</p>
                    <p className="text-sm mt-2">{selected.disabled ? "Disabled" : "Active"}</p>
                    <button
                      onClick={() => updateUser({ disabled: !selected.disabled })}
                      disabled={actionLoading}
                      className="mt-2 px-3 py-2 text-xs rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {selected.disabled ? "Enable account" : "Disable account"}
                    </button>
                  </div>
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Last Order</p>
                    <p className="text-sm mt-2">{selected.lastOrderAt ? new Date(selected.lastOrderAt).toLocaleDateString() : "--"}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm text-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Contact</p>
                    <p className="mt-2">Email: {selected.email}</p>
                    <p>Phone: {selected.phone || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                    <p className="mt-2">{selected.address?.address || "--"}</p>
                    <p>{selected.address?.city || "--"}, {selected.address?.state || "--"}</p>
                    <p>{selected.address?.country || "--"}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Orders</p>
                    <p className="text-2xl font-semibold mt-2">{selected.orders}</p>
                  </div>
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue</p>
                    <p className="text-2xl font-semibold mt-2">{selected.revenue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Order History</p>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    {ordersLoading ? (
                      <div className="p-4 text-sm text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No orders found for this user.</div>
                    ) : (
                      <div className="divide-y">
                        {orders.map((order) => (
                          <div key={order._id} className="p-4 text-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-[#16161A]">{order._id}</div>
                                <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{order.total.toLocaleString()} {order.currency}</div>
                                <div className="text-xs text-gray-500">{order.orderStatus} · {order.paymentStatus}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
