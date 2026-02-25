"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/app/context/AuthContext"

const mapPermissionToLabel = (p: string) => {
  switch (p) {
    case "email:send": return "Can send emails"
    case "orders:receive": return "Receives orders"
    case "seo:view": return "View SEO & campaigns"
    case "seo:edit": return "Edit SEO & campaigns"
    case "banner:edit": return "Edit promo banner"
    case "users:view": return "View users"
    case "admin:roles:view": return "View roles"
    case "admin:roles:assign": return "Assign roles"
    case "finance:reports": return "Finance reports"
    case "catalog:view": return "View catalog"
    case "content:edit": return "Edit content"
    default: return p
  }
}

type AdminUser = {
  _id: string
  email: string
  userName: string
  isEmailVerified?: boolean
  updatedAt?: string
  roles?: string[]
}

type PendingInvite = {
  _id: string
  email: string
  userName: string
  createdAt: string
  expiresAt: string
}

export default function AdminTeamPage() {
  const { user, refreshUser } = useAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [availableRoles, setAvailableRoles] = useState<Array<{ _id: string; name: string; description?: string; permissions?: string[]; emailSubscriptions?: string[] }>>([])
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editingRoles, setEditingRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [form, setForm] = useState({ fullName: "", userName: "", email: "" })

  const adminEmail = user?.email?.trim().toLowerCase() || ""

  const loadTeam = async () => {
    if (!adminEmail) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/team/invite", {
        cache: "no-store",
        headers: { "x-admin-email": adminEmail },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load team")
      setAdmins(data.admins || [])
      setPendingInvites(data.pendingInvites || [])

      // fetch roles (full docs)
      try {
        const rres = await fetch("/api/admin/roles", { headers: { "x-admin-email": adminEmail } })
        const rdata = await rres.json()
        setAvailableRoles((rdata.roles || []).map((r: { _id: unknown; name?: string; description?: string; permissions?: string[]; emailSubscriptions?: string[] }) => ({ _id: String(r._id), name: r.name || "", description: r.description, permissions: r.permissions || [], emailSubscriptions: r.emailSubscriptions || [] })))
      } catch (e) {
        console.error("Failed loading roles (full)", e)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!adminEmail) return
    loadTeam()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail])

  const sendInvite = async () => {
    setError("")
    setSuccess("")
    if (!adminEmail) {
      setError("Admin session not ready. Please refresh and try again.")
      return
    }
    if (!form.fullName.trim() || !form.userName.trim() || !form.email.trim()) {
      setError("Full name, username, and email are required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          userName: form.userName.trim(),
          email: form.email.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to send invite")

      setForm({ fullName: "", userName: "", email: "" })
      setSuccess("Admin invite sent successfully.")
      await loadTeam()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invite")
    } finally {
      setSubmitting(false)
    }
  }

  const resendInvite = async (inviteId: string) => {
    setError("")
    setSuccess("")
    if (!adminEmail) {
      setError("Admin session not ready. Please refresh and try again.")
      return
    }
    setActionLoadingId(inviteId)
    try {
      const res = await fetch("/api/admin/team/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ inviteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to resend invite")
      setSuccess("Invite resent.")
      await loadTeam()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resend invite")
    } finally {
      setActionLoadingId(null)
    }
  }

  const revokeInvite = async (inviteId: string) => {
    setError("")
    setSuccess("")
    if (!adminEmail) {
      setError("Admin session not ready. Please refresh and try again.")
      return
    }
    setActionLoadingId(inviteId)
    try {
      const res = await fetch("/api/admin/team/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ inviteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to revoke invite")
      setSuccess("Invite revoked.")
      await loadTeam()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke invite")
    } finally {
      setActionLoadingId(null)
    }
  }

  

  const openUserRoleEditor = (admin: AdminUser) => {
    // navigate to Roles page and open the user editor there
    const router = (typeof window !== 'undefined') ? (window as any).next?.router : null
    try {
      // prefer next/navigation router if available
      // fallback to location change
      const url = `/admin/settings/roles?targetUser=${encodeURIComponent(admin.email)}`
      if (typeof window !== 'undefined') window.location.href = url
    } catch (e) {
      const url = `/admin/settings/roles?targetUser=${encodeURIComponent(admin.email)}`
      window.location.href = url
    }
  }

  const toggleEditingRole = (roleId: string) => {
    setEditingRoles((prev) => (prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]))
  }

  const saveRolesForUser = async () => {
    if (!editingUser) return
    setActionLoadingId("save")
    try {
      const res = await fetch('/api/admin/roles/set', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail }, body: JSON.stringify({ email: editingUser.email, roleIds: editingRoles }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save roles')
      setEditingUser(null)
      await loadTeam()
      try { await refreshUser() } catch { }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save roles')
    } finally {
      setActionLoadingId(null)
    }
  }

  

  // scroll to roles helper
  const scrollToRoles = () => {
    if (typeof window === "undefined") return
    const el = document.getElementById("roles-section")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.hash === "#roles") scrollToRoles()
  }, [])

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Team Setup</h1>
        <p className="text-sm text-gray-600">Invite admins by username and email. They become admins after email confirmation.</p>
        <div className="mt-3">
          <Link href="/admin/settings/roles" className="inline-block px-3 py-1 text-sm rounded border border-[#8D2741] text-[#8D2741]">Manage Roles</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Invite New Admin</p>
          <div className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Full name (e.g. Jane Doe)"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Username (unique handle)"
              value={form.userName}
              onChange={(e) => setForm((prev) => ({ ...prev, userName: e.target.value }))}
            />
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}
            <button
              onClick={sendInvite}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded bg-[#8D2741] text-white disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Pending Invites</p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : pendingInvites.length === 0 ? (
            <p className="text-sm text-gray-500">No pending invites.</p>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite._id} className="border border-[#EEE7DA] rounded p-3 text-sm">
                  <p className="font-semibold text-[#16161A]">{invite.userName}</p>
                  <p className="text-gray-600">{invite.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {new Date(invite.expiresAt).toLocaleString()}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => resendInvite(invite._id)}
                      disabled={actionLoadingId === invite._id}
                      className="px-2 py-1 text-xs rounded border border-[#8D2741] text-[#8D2741] disabled:opacity-50"
                    >
                      {actionLoadingId === invite._id ? "Working..." : "Resend"}
                    </button>
                    <button
                      onClick={() => revokeInvite(invite._id)}
                      disabled={actionLoadingId === invite._id}
                      className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Current Admins</p>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-gray-500">No admins found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {admins.map((admin) => (
              <div key={admin._id} className="border border-[#EEE7DA] rounded p-3 text-sm">
                <p className="font-semibold text-[#16161A]">{admin.userName}</p>
                <p className="text-gray-600">{admin.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {admin.isEmailVerified ? "Email verified" : "Email not verified"}
                </p>
                <div className="mt-3">
                  <div className="text-xs text-gray-500">Roles</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button onClick={() => openUserRoleEditor(admin)} className="px-2 py-1 text-xs rounded border text-gray-700">Manage</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* roles moved to dedicated Roles page */}

      
      {/* Role editor modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Manage roles for {editingUser.userName}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                    {availableRoles.map((r) => (
                      <label key={r._id} className="flex items-start gap-3">
                        <input className="mt-1" type="checkbox" checked={editingRoles.includes(r._id)} onChange={() => toggleEditingRole(r._id)} />
                        <div>
                          <div className="font-semibold">{r.name}</div>
                          {r.description && <div className="text-xs text-gray-600">{r.description}</div>}
                          {Array.isArray(r.permissions) && r.permissions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {r.permissions.map((p) => (
                                <span key={p} className="text-xs px-2 py-0.5 rounded bg-gray-100 border text-gray-700">{mapPermissionToLabel(p)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={saveRolesForUser} disabled={actionLoadingId === 'save'} className="px-3 py-2 bg-[#8D2741] text-white rounded">{actionLoadingId === 'save' ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
