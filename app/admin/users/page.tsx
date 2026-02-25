"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"

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

type UserProfile = {
  _id: string
  email: string
  userName: string
  phone?: string
  role?: string
  roles?: string[]
  disabled?: boolean
  isEmailVerified?: boolean
  emailVerifiedAt?: string | null
  preferences?: { newsletter: boolean; notifications: boolean } | null
  address?: UserRow["address"] | null
  cart?: unknown[]
  wishlist?: unknown[]
  createdAt?: string | null
  updatedAt?: string | null
}

type OrderRow = {
  _id: string
  total: number
  currency: "NGN" | "USD" | "GBP"
  orderStatus: string
  paymentStatus: string
  createdAt: string
  paymentMethod?: string
  shippingAddress?: {
    userName?: string
    email?: string
    phone?: string
    city?: string
    state?: string
    address?: string
  }
  items?: Array<{
    name?: string
    quantity?: number
    price?: number
    size?: string
    color?: string
  }>
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
  const [profileLoading, setProfileLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" })
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailSuccess, setEmailSuccess] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const qs = query ? `?q=${encodeURIComponent(query)}` : ""
        const adminEmail = user?.email?.trim().toLowerCase() || ""
        const headers: Record<string, string> = adminEmail ? { "x-admin-email": adminEmail } : {}
        const res = await fetch(`/api/admin/users${qs}`, { cache: "no-store", headers })
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
  }, [query, user?.email])

  const selected = useMemo(
    () => users.find((u) => u._id === selectedId) || null,
    [users, selectedId]
  )

  useEffect(() => {
    const loadProfile = async () => {
      if (!selectedId) {
        setProfile(null)
        return
      }
      const adminEmail = user?.email?.trim().toLowerCase() || ""
      if (!adminEmail) return

      setProfileLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${selectedId}`, {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load user profile")
        setProfile(data?.user || null)
      } catch (e) {
        console.error(e)
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [selectedId, user?.email])

  useEffect(() => {
    const loadOrders = async () => {
      if (!selectedId) {
        setOrders([])
        return
      }
      setOrdersLoading(true)
      try {
        const adminEmail = user?.email?.trim().toLowerCase() || ""
        const headers: Record<string, string> = adminEmail ? { "x-admin-email": adminEmail } : {}
        const res = await fetch(`/api/admin/users/${selectedId}/orders`, { cache: "no-store", headers })
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
  }, [selectedId, user?.email])

  const updateUser = async (payload: { role?: string; disabled?: boolean }) => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      const adminEmail = user?.email?.trim().toLowerCase() || ""
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (adminEmail) headers["x-admin-email"] = adminEmail
      const res = await fetch(`/api/admin/users/${selectedId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update user")
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedId ? { ...u, ...payload } : u))
      )
      setProfile((prev) => (prev ? { ...prev, ...payload } : prev))
    } catch (error) {
      console.error(error)
      alert("Failed to update user")
    } finally {
      setActionLoading(false)
    }
  }

  const sendEmailToUser = async () => {
    if (!selectedId) return
    setEmailError("")
    setEmailSuccess("")
    const adminEmail = user?.email?.trim().toLowerCase() || ""
    if (!adminEmail) {
      setEmailError("Admin session not ready.")
      return
    }
    const subject = emailForm.subject.trim()
    const message = emailForm.message.trim()
    if (!subject || !message) {
      setEmailError("Subject and message are required.")
      return
    }
    setEmailSending(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to send email")
      setEmailSuccess("Email sent.")
      setEmailForm({ subject: "", message: "" })
      setTimeout(() => setEmailOpen(false), 600)
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "Failed to send email")
    } finally {
      setEmailSending(false)
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
            href={`/api/admin/users/export${query ? `?q=${encodeURIComponent(query)}` : ""}${user?.email ? `&email=${encodeURIComponent(user.email)}` : ""}`}
            className="px-3 py-2 text-xs rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 lg:w-5/12">
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
                  <div className="text-xs text-gray-500 mt-1">
                    Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "--"}
                  </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEmailError("")
                        setEmailSuccess("")
                        setEmailOpen(true)
                      }}
                      className="px-3 py-2 text-xs rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                    >
                      Send email
                    </button>
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

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email verification</p>
                    {profileLoading ? (
                      <p className="text-sm mt-2 text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="text-sm mt-2">{profile?.isEmailVerified ? "Verified" : "Not verified"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Verified at: {profile?.emailVerifiedAt ? new Date(profile.emailVerifiedAt).toLocaleString() : "--"}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">RBAC roles</p>
                    {profileLoading ? (
                      <p className="text-sm mt-2 text-gray-500">Loading...</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(profile?.roles || []).length ? (
                          (profile?.roles || []).map((r) => (
                            <span key={String(r)} className="text-xs px-2 py-0.5 rounded bg-white border text-gray-700">
                              {String(r)}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">--</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Joined</p>
                    <p className="text-sm mt-2">
                      {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "--"}
                    </p>
                  </div>
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Last Profile Update</p>
                    <p className="text-sm mt-2">
                      {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "--"}
                    </p>
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

                <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Preferences</p>
                    {profileLoading ? (
                      <p className="text-sm mt-2 text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="mt-2">Newsletter: {profile?.preferences?.newsletter ? "Yes" : "No"}</p>
                        <p>Notifications: {profile?.preferences?.notifications ? "Yes" : "No"}</p>
                      </>
                    )}
                  </div>
                  <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Saved items</p>
                    {profileLoading ? (
                      <p className="text-sm mt-2 text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="mt-2">Cart items: {Array.isArray(profile?.cart) ? profile?.cart?.length : 0}</p>
                        <p>Wishlist items: {Array.isArray(profile?.wishlist) ? profile?.wishlist?.length : 0}</p>
                      </>
                    )}
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
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Order History & Delivery Details</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/admin/users/${selected._id}/orders/export`}
                        className="px-3 py-1 text-xs rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                      >
                        Export Orders CSV
                      </a>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1 text-xs rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    {ordersLoading ? (
                      <div className="p-4 text-sm text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No orders found for this user.</div>
                    ) : (
                      <div className="divide-y">
                        {orders.map((order) => (
                          <div key={order._id} className="p-4 text-sm space-y-3">
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
                            <div className="rounded-lg border border-[#EEE7DA] bg-[#FBF7F3] p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Delivery Information</p>
                              <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-700">
                                <p>Name: {order.shippingAddress?.userName || "--"}</p>
                                <p>Email: {order.shippingAddress?.email || "--"}</p>
                                <p>Phone: {order.shippingAddress?.phone || "--"}</p>
                                <p>Payment Method: {order.paymentMethod || "--"}</p>
                                <p className="md:col-span-2">
                                  Address: {[
                                    order.shippingAddress?.address,
                                    order.shippingAddress?.city,
                                    order.shippingAddress?.state,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "--"}
                                </p>
                              </div>
                            </div>
                            {(order.items || []).length > 0 && (
                              <div className="rounded-lg border border-[#EEE7DA] p-3">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Items</p>
                                <div className="space-y-1 text-xs text-gray-700">
                                  {(order.items || []).map((item, idx) => (
                                    <p key={`${order._id}-${idx}`}>
                                      {item.name || "Item"} x{item.quantity || 1} ({item.color || "-"} / {item.size || "-"}) - {Number(item.price || 0).toLocaleString()}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
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

      {emailOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Email user</p>
                <h3 className="text-lg font-semibold text-[#16161A]">{selected.userName}</h3>
                <p className="text-xs text-gray-500">{selected.email}</p>
              </div>
              <button
                onClick={() => setEmailOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                <input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Subject"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm min-h-[120px]"
                  placeholder="Write your message..."
                />
              </div>
              {emailError && <p className="text-xs text-red-600">{emailError}</p>}
              {emailSuccess && <p className="text-xs text-green-700">{emailSuccess}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEmailOpen(false)}
                  className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendEmailToUser}
                  disabled={emailSending}
                  className="px-3 py-2 text-sm rounded bg-[#8D2741] text-white disabled:opacity-50"
                >
                  {emailSending ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                Requires the RBAC permission <span className="font-semibold">email:send</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


