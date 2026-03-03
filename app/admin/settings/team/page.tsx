"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/app/context/AuthContext"

type TeamMember = {
  _id: string
  email?: string
  userName?: string
  fullName?: string
  role?: string
  isEmailVerified?: boolean
  updatedAt?: string
  roles?: string[]
}

type PendingInvite = {
  _id: string
  userId?: string
  email?: string
  userName?: string
  fullName?: string
  createdAt: string
  expiresAt: string
  roleId?: string
  roleName?: string
}

type RoleDoc = {
  _id: string
  name: string
  description?: string
  permissions?: string[]
}

type RoleStatus = "pending" | "assigned" | "none"

const mapPermissionToLabel = (p: string) => {
  switch (p) {
    case "team:view": return "View team members"
    case "team:message": return "Send in-app team messages"
    case "admin:audit:view": return "View admin logs"
    case "users:view": return "View users"
    case "users:manage": return "Manage users"
    case "orders:view": return "View orders"
    case "orders:edit": return "Edit orders"
    case "finance:reports": return "View finance reports"
    case "catalog:view": return "View catalog"
    case "catalog:edit": return "Edit catalog"
    case "content:edit": return "Edit content"
    case "lookbook:edit": return "Edit lookbook"
    case "banner:edit": return "Edit banner"
    case "seo:view": return "View SEO and analysis"
    case "seo:edit": return "Edit SEO settings"
    case "site:analytics:view": return "View analytics"
    case "site:analytics:manage": return "Manage analytics actions"
    case "email:send": return "Send admin emails"
    default: return p
  }
}

export default function AdminTeamPage() {
  const { user, refreshUser } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [availableRoles, setAvailableRoles] = useState<RoleDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ fullName: "", userName: "", email: "", roleId: "" })
  const [capabilities, setCapabilities] = useState({
    canManageTeam: false,
    canMessageTeam: false,
    canSendDirectEmail: false,
    canViewSensitiveTeamIdentity: false,
  })

  const [messageOpenForUserId, setMessageOpenForUserId] = useState<string | null>(null)
  const [messageDraft, setMessageDraft] = useState({ subject: "", message: "", deliverEmail: true, deliverNotification: true })

  const adminEmail = user?.email?.trim().toLowerCase() || ""
  const roleNameById = useMemo(
    () => Object.fromEntries(availableRoles.map((r) => [r._id, r.name])),
    [availableRoles]
  )
  const selectedInviteRole = useMemo(
    () => availableRoles.find((r) => r._id === form.roleId) || null,
    [availableRoles, form.roleId]
  )
  const pendingInviteEmails = useMemo(() => {
    return new Set(
      pendingInvites
        .map((invite) => String(invite.email || "").trim().toLowerCase())
        .filter(Boolean)
    )
  }, [pendingInvites])
  const pendingInviteUserIds = useMemo(() => {
    return new Set(
      pendingInvites
        .map((invite) => String(invite.userId || "").trim())
        .filter(Boolean)
    )
  }, [pendingInvites])
  const activeMessageUser = useMemo(
    () => teamMembers.find((m) => m._id === messageOpenForUserId) || null,
    [messageOpenForUserId, teamMembers]
  )

  const loadTeam = async () => {
    if (!adminEmail) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [teamRes, rolesRes] = await Promise.all([
        fetch("/api/admin/team/invite", {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        }),
        fetch("/api/admin/roles", {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        }),
      ])

      const teamData = await teamRes.json()
      if (!teamRes.ok) throw new Error(teamData?.error || "Failed to load team")
      setTeamMembers(teamData.teamMembers || [])
      setPendingInvites(teamData.pendingInvites || [])
      setCapabilities({
        canManageTeam: !!teamData?.capabilities?.canManageTeam,
        canMessageTeam: !!teamData?.capabilities?.canMessageTeam,
        canSendDirectEmail: !!teamData?.capabilities?.canSendDirectEmail,
        canViewSensitiveTeamIdentity: !!teamData?.capabilities?.canViewSensitiveTeamIdentity,
      })

      const roleData = await rolesRes.json()
      if (rolesRes.ok) {
        const docs = (roleData.roles || []).map((r: { _id: unknown; name?: string; description?: string; permissions?: string[] }) => ({
          _id: String(r._id),
          name: String(r.name || ""),
          description: typeof r.description === "string" ? r.description : "",
          permissions: Array.isArray(r.permissions) ? r.permissions : [],
        }))
        setAvailableRoles(docs)
        if (!form.roleId && docs[0]?._id) {
          setForm((prev) => ({ ...prev, roleId: docs[0]._id }))
        }
      } else {
        setAvailableRoles([])
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
    if (!capabilities.canManageTeam) {
      setError("You do not have permission to invite team members.")
      return
    }
    if (!form.fullName.trim() || !form.userName.trim() || !form.email.trim() || !form.roleId) {
      setError("Full name, username, email, and role are required.")
      return
    }
    if (availableRoles.length === 0) {
      setError("No roles found. Create a role first, then attach it to this admin invite.")
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
          roleId: form.roleId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to send invite")

      setForm((prev) => ({ fullName: "", userName: "", email: "", roleId: prev.roleId }))
      setSuccess("Admin invite sent successfully with selected role permissions.")
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
    if (!capabilities.canManageTeam) {
      setError("You do not have permission to resend invites.")
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
    if (!capabilities.canManageTeam) {
      setError("You do not have permission to revoke invites.")
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

  const openRoleMenu = (member: TeamMember) => {
    if (!capabilities.canManageTeam) return
    const currentRole = Array.isArray(member.roles) ? member.roles[0] || "" : ""
    setSelectedRoleByUser((prev) => ({ ...prev, [member._id]: currentRole }))
    setEditingUserId(member._id)
    setError("")
    setSuccess("")
  }

  const saveSingleRole = async (member: TeamMember) => {
    if (!capabilities.canManageTeam) return
    if (!member.email) {
      setError("Member email is hidden or unavailable.")
      return
    }
    const selectedRole = selectedRoleByUser[member._id] || ""
    if (!selectedRole) {
      setError("Select a role before saving, or click Remove role.")
      return
    }

    setActionLoadingId(`save-${member._id}`)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/admin/roles/set", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ email: member.email, roleIds: [selectedRole] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save role")
      setSuccess("Role updated.")
      setEditingUserId(null)
      await loadTeam()
      try { await refreshUser() } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save role")
    } finally {
      setActionLoadingId(null)
    }
  }

  const removeRole = async (member: TeamMember) => {
    if (!capabilities.canManageTeam) return
    if (!member.email) {
      setError("Member email is hidden or unavailable.")
      return
    }
    setActionLoadingId(`remove-${member._id}`)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/admin/roles/set", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ email: member.email, roleIds: [] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to remove role")
      setSuccess("Role removed.")
      setEditingUserId(null)
      await loadTeam()
      try { await refreshUser() } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove role")
    } finally {
      setActionLoadingId(null)
    }
  }

  const openMessageModal = (member: TeamMember) => {
    setMessageOpenForUserId(member._id)
    setMessageDraft({
      subject: "",
      message: "",
      deliverEmail: capabilities.canSendDirectEmail,
      deliverNotification: true,
    })
  }

  const sendTeamMessage = async () => {
    if (!activeMessageUser) return
    setError("")
    setSuccess("")
    const subject = messageDraft.subject.trim()
    const message = messageDraft.message.trim()
    if (!subject || !message) {
      setError("Subject and message are required.")
      return
    }

    setActionLoadingId(`message-${activeMessageUser._id}`)
    try {
      const res = await fetch("/api/admin/team/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail,
        },
        body: JSON.stringify({
          recipientUserId: activeMessageUser._id,
          subject,
          message,
          deliverEmail: messageDraft.deliverEmail,
          deliverNotification: messageDraft.deliverNotification,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to send message")
      setSuccess(`Message sent to ${activeMessageUser.fullName || activeMessageUser.userName || activeMessageUser._id}.`)
      setMessageOpenForUserId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
    } finally {
      setActionLoadingId(null)
    }
  }

  const getRoleStatus = (member: TeamMember): RoleStatus => {
    const memberId = String(member._id || "").trim()
    if (memberId && pendingInviteUserIds.has(memberId)) return "pending"
    const email = String(member.email || "").trim().toLowerCase()
    if (pendingInviteEmails.has(email)) return "pending"
    if (Array.isArray(member.roles) && member.roles.length > 0) return "assigned"
    return "none"
  }

  const statusBadgeClass = (status: RoleStatus) => {
    if (status === "pending") return "bg-amber-50 text-amber-800 border border-amber-200"
    if (status === "assigned") return "bg-emerald-50 text-emerald-800 border border-emerald-200"
    return "bg-gray-100 text-gray-700 border border-gray-200"
  }

  const statusLabel = (status: RoleStatus) => {
    if (status === "pending") return "Pending"
    if (status === "assigned") return "Assigned"
    return "No role"
  }

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Team Setup</h1>
        <p className="text-sm text-gray-600">
          {capabilities.canManageTeam
            ? "Invite admins by username, email, and role."
            : "View team members and send verified-message updates."}
        </p>
      </motion.div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {success && <p className="text-xs text-green-600 mb-2">{success}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {capabilities.canManageTeam ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Invite New Admin</p>
            {availableRoles.length === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                No roles available yet. Create a role first, then invite this admin account.
              </p>
            )}
            <div className="space-y-3">
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Full name (e.g. Jane Doe)" value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Username (unique handle)" value={form.userName} onChange={(e) => setForm((prev) => ({ ...prev, userName: e.target.value }))} />
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              <select className="w-full border rounded px-3 py-2 text-sm bg-white" value={form.roleId} onChange={(e) => setForm((prev) => ({ ...prev, roleId: e.target.value }))}>
                <option value="">Select a role</option>
                {availableRoles.map((role) => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
              {selectedInviteRole && (
                <div className="rounded border border-[#EEE7DA] bg-[#FBF7F3] p-2">
                  <p className="text-xs font-semibold text-[#16161A]">Invite will grant: {selectedInviteRole.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedInviteRole.permissions || []).map((p) => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded bg-white border text-gray-700">{mapPermissionToLabel(p)}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={sendInvite} disabled={submitting || availableRoles.length === 0} className="px-4 py-2 text-sm rounded bg-[#8D2741] text-white disabled:opacity-50">
                {submitting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow p-5 border border-[#EEE7DA]">
            <p className="text-sm font-semibold text-gray-700">Team invite controls are owner-only.</p>
            <p className="text-xs text-gray-600 mt-1">You can still view team status and send updates to verified team members.</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Pending Invites</p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : pendingInvites.length === 0 ? (
            <p className="text-sm text-gray-500">No pending invites.</p>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((invite, idx) => (
                <motion.div key={invite._id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} className="border border-[#EEE7DA] rounded p-3 text-sm">
                  <p className="font-semibold text-[#16161A]">{invite.fullName || invite.userName || "Team member"}</p>
                  {capabilities.canViewSensitiveTeamIdentity && invite.email && (
                    <p className="text-gray-600">{invite.email}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Invite ID: {invite._id}</p>
                  <p className="text-xs text-gray-500 mt-1">Role: {invite.roleName || "Not set"}</p>
                  <p className="text-xs text-gray-500 mt-1">Expires: {new Date(invite.expiresAt).toLocaleString()}</p>
                  {capabilities.canManageTeam && (
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => resendInvite(invite._id)} disabled={actionLoadingId === invite._id} className="px-2 py-1 text-xs rounded border border-[#8D2741] text-[#8D2741] disabled:opacity-50">
                        {actionLoadingId === invite._id ? "Working..." : "Resend"}
                      </button>
                      <button onClick={() => revokeInvite(invite._id)} disabled={actionLoadingId === invite._id} className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 disabled:opacity-50">
                        Revoke
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow p-5 mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Team Members</p>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : teamMembers.length === 0 ? (
          <p className="text-sm text-gray-500">No invited members found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teamMembers.map((member, idx) => {
              const currentRoleId = Array.isArray(member.roles) ? member.roles[0] || "" : ""
              const currentRoleName = currentRoleId ? roleNameById[currentRoleId] || "Unknown role" : "No role assigned"
              const label = currentRoleId ? "Edit role" : "Assign role"
              const menuOpen = editingUserId === member._id
              const roleStatus = getRoleStatus(member)

              return (
                <motion.div key={member._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} className="border border-[#EEE7DA] rounded p-3 text-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[#16161A]">{member.fullName || member.userName || "Unnamed user"}</p>
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${statusBadgeClass(roleStatus)}`}>
                      {statusLabel(roleStatus)}
                    </span>
                  </div>
                  {capabilities.canViewSensitiveTeamIdentity && member.email && (
                    <p className="text-gray-600">{member.email}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {member.isEmailVerified ? "Email verified" : "Email not verified"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Member ID: {member._id}</p>
                  <p className="text-xs text-gray-500 mt-1">Current role: {currentRoleName}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {capabilities.canManageTeam && (
                      <button onClick={() => openRoleMenu(member)} className="px-2 py-1 text-xs rounded border text-gray-700">
                        {label}
                      </button>
                    )}
                    {capabilities.canMessageTeam && (
                      <button
                        onClick={() => openMessageModal(member)}
                        disabled={!member.isEmailVerified}
                        className="px-2 py-1 text-xs rounded border border-[#8D2741] text-[#8D2741] disabled:opacity-50"
                        title={member.isEmailVerified ? "Send email/notification message" : "Email must be verified before sending"}
                      >
                        Message
                      </button>
                    )}
                  </div>

                  {menuOpen && capabilities.canManageTeam && (
                    <div className="mt-3 border rounded p-2 bg-[#FBF7F3]">
                      <select className="w-full border rounded px-2 py-1 text-xs bg-white" value={selectedRoleByUser[member._id] || ""} onChange={(e) => setSelectedRoleByUser((prev) => ({ ...prev, [member._id]: e.target.value }))}>
                        <option value="">Select role</option>
                        {availableRoles.map((role) => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => saveSingleRole(member)} disabled={actionLoadingId === `save-${member._id}`} className="px-2 py-1 text-xs rounded bg-[#8D2741] text-white disabled:opacity-50">
                          {actionLoadingId === `save-${member._id}` ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => removeRole(member)} disabled={actionLoadingId === `remove-${member._id}`} className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 disabled:opacity-50">
                          {actionLoadingId === `remove-${member._id}` ? "Removing..." : "Remove role"}
                        </button>
                        <button onClick={() => setEditingUserId(null)} className="px-2 py-1 text-xs rounded border text-gray-700">Close</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {activeMessageUser && (
          <motion.div
            key="team-message-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#EEE7DA] p-5"
            >
              <h3 className="text-lg font-bold text-[#16161A]">Message {activeMessageUser.fullName || activeMessageUser.userName || activeMessageUser._id}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Recipient: {capabilities.canViewSensitiveTeamIdentity && activeMessageUser.email
                  ? activeMessageUser.email
                  : `ID ${activeMessageUser._id}`}
              </p>

              <div className="mt-4 space-y-3">
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Subject"
                  value={messageDraft.subject}
                  onChange={(e) => setMessageDraft((prev) => ({ ...prev, subject: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm min-h-[130px]"
                  placeholder="Write your message..."
                  value={messageDraft.message}
                  onChange={(e) => setMessageDraft((prev) => ({ ...prev, message: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={messageDraft.deliverEmail}
                    onChange={(e) => setMessageDraft((prev) => ({ ...prev, deliverEmail: e.target.checked }))}
                    disabled={!capabilities.canSendDirectEmail}
                  />
                  Send to verified email
                </label>
                {!capabilities.canSendDirectEmail && (
                  <p className="text-[11px] text-gray-500">Direct email is restricted to general admin/super admin accounts.</p>
                )}
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={messageDraft.deliverNotification}
                    onChange={(e) => setMessageDraft((prev) => ({ ...prev, deliverNotification: e.target.checked }))}
                  />
                  Send to admin notifications panel
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setMessageOpenForUserId(null)}
                  className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={sendTeamMessage}
                  disabled={actionLoadingId === `message-${activeMessageUser._id}`}
                  className="px-3 py-2 text-sm rounded bg-[#8D2741] text-white disabled:opacity-50"
                >
                  {actionLoadingId === `message-${activeMessageUser._id}` ? "Sending..." : "Send message"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
