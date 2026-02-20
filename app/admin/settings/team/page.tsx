"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"

type AdminUser = {
  _id: string
  email: string
  userName: string
  isEmailVerified?: boolean
  updatedAt?: string
}

type PendingInvite = {
  _id: string
  email: string
  userName: string
  createdAt: string
  expiresAt: string
}

export default function AdminTeamPage() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ userName: "", email: "" })

  const loadTeam = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/team/invite", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load team")
      setAdmins(data.admins || [])
      setPendingInvites(data.pendingInvites || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  const sendInvite = async () => {
    setError("")
    setSuccess("")
    if (!form.userName.trim() || !form.email.trim()) {
      setError("Username and email are required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: form.userName.trim(),
          email: form.email.trim(),
          createdByEmail: user?.email || "",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to send invite")

      setForm({ userName: "", email: "" })
      setSuccess("Admin invite sent successfully.")
      await loadTeam()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invite")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Team Setup</h1>
        <p className="text-sm text-gray-600">Invite admins by username and email. They become admins after email confirmation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Invite New Admin</p>
          <div className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Username"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
