"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"

type RoleDoc = {
  _id: string
  name: string
  description?: string
  permissions: string[]
  emailSubscriptions: string[]
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

type UserHit = {
  _id: string
  email: string
  userName: string
  role?: string
}

type RoleApiDoc = {
  _id: unknown
  name?: unknown
  description?: unknown
  permissions?: unknown
  emailSubscriptions?: unknown
  createdAt?: unknown
  updatedAt?: unknown
  createdBy?: unknown
}

type UserApiHit = {
  _id: unknown
  email?: unknown
  userName?: unknown
  role?: unknown
}

function uniqTrimLines(raw: string) {
  const items = String(raw || "")
    .split(/[\n,]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
  return Array.from(new Set(items))
}

const KNOWN_PERMISSIONS = [
  "admin:roles:view",
  "admin:roles:create",
  "admin:roles:edit",
  "admin:roles:delete",
  "admin:roles:assign",
  "admin:audit:view",
  "users:view",
  "users:manage",
  "orders:view",
  "orders:edit",
  "finance:reports",
  "catalog:view",
  "catalog:edit",
  "content:edit",
  "lookbook:edit",
  "banner:edit",
  "seo:view",
  "seo:edit",
  "site:analytics:view",
  "site:analytics:manage",
  "email:send",
  "support:ticket:view",
  "support:ticket:reply",
  "payouts:view",
  "orders:refunds",
  "finance:reconcile",
] as const

const KNOWN_EMAIL_EVENTS = [
  "order.created",
  "seo.report.available",
  "content.updated",
  "support.ticket.created",
  "order.issue",
  "payment.failed",
  "refund.processed",
] as const

export default function RolesPage() {
  const { user } = useAuth()
  const adminEmail = user?.email?.trim().toLowerCase() || ""

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [roles, setRoles] = useState<RoleDoc[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  const selectedRole = useMemo(
    () => roles.find((r) => r._id === selectedRoleId) || null,
    [roles, selectedRoleId]
  )

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create")
  const [editorForm, setEditorForm] = useState({
    roleId: "",
    name: "",
    description: "",
    permissionsText: "",
    emailSubsText: "",
  })
  const [editorSaving, setEditorSaving] = useState(false)
  const [editorError, setEditorError] = useState("")

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignQuery, setAssignQuery] = useState("")
  const [assignHits, setAssignHits] = useState<UserHit[]>([])
  const [assignSelectedUser, setAssignSelectedUser] = useState<UserHit | null>(null)
  const [assignUserRoleIds, setAssignUserRoleIds] = useState<string[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState("")
  const [assignSuccess, setAssignSuccess] = useState("")

  const loadRoles = async () => {
    if (!adminEmail) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/roles", { cache: "no-store", headers: { "x-admin-email": adminEmail } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load roles")
      const docs = (data?.roles || []).map((r: RoleApiDoc) => ({
        _id: String(r._id),
        name: String(r.name || ""),
        description: typeof r.description === "string" ? r.description : "",
        permissions: Array.isArray(r.permissions) ? r.permissions.map((p) => String(p)) : [],
        emailSubscriptions: Array.isArray(r.emailSubscriptions) ? r.emailSubscriptions.map((e) => String(e)) : [],
        createdAt: r.createdAt ? String(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
        createdBy: r.createdBy ? String(r.createdBy) : undefined,
      })) as RoleDoc[]
      setRoles(docs)
      setSelectedRoleId((cur) => cur ?? (docs[0]?._id || null))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!adminEmail) return
    loadRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail])

  const openCreate = () => {
    setEditorMode("create")
    setEditorForm({
      roleId: "",
      name: "",
      description: "",
      permissionsText: "",
      emailSubsText: "",
    })
    setEditorError("")
    setEditorOpen(true)
  }

  const openEdit = (role: RoleDoc) => {
    setEditorMode("edit")
    setEditorForm({
      roleId: role._id,
      name: role.name || "",
      description: role.description || "",
      permissionsText: (role.permissions || []).join("\n"),
      emailSubsText: (role.emailSubscriptions || []).join("\n"),
    })
    setEditorError("")
    setEditorOpen(true)
  }

  const saveRole = async () => {
    setEditorError("")
    if (!adminEmail) return setEditorError("Admin session not ready.")
    const name = editorForm.name.trim()
    if (!name) return setEditorError("Role name is required.")

    const permissions = uniqTrimLines(editorForm.permissionsText)
    const emailSubscriptions = uniqTrimLines(editorForm.emailSubsText)
    if (editorMode === "create" && permissions.length === 0) {
      return setEditorError("At least 1 permission is required.")
    }

    setEditorSaving(true)
    try {
      const payload: {
        name: string
        description: string
        permissions: string[]
        emailSubscriptions: string[]
      } = {
        name,
        description: editorForm.description,
        permissions,
        emailSubscriptions,
      }
      const res = await fetch("/api/admin/roles", {
        method: editorMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify(editorMode === "create" ? payload : { ...payload, roleId: editorForm.roleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save role")
      setEditorOpen(false)
      await loadRoles()
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : "Failed to save role")
    } finally {
      setEditorSaving(false)
    }
  }

  const deleteRole = async () => {
    if (!selectedRole) return
    setDeleteError("")
    if (!adminEmail) return setDeleteError("Admin session not ready.")
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ roleId: selectedRole._id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to delete role")
      setDeleteOpen(false)
      setSelectedRoleId(null)
      await loadRoles()
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete role")
    } finally {
      setDeleteLoading(false)
    }
  }

  const openAssign = async () => {
    setAssignError("")
    setAssignSuccess("")
    setAssignQuery("")
    setAssignHits([])
    setAssignSelectedUser(null)
    setAssignUserRoleIds([])
    setAssignOpen(true)
  }

  const searchUsers = async () => {
    if (!adminEmail) return
    setAssignError("")
    setAssignLoading(true)
    try {
      const qs = assignQuery.trim() ? `?q=${encodeURIComponent(assignQuery.trim())}&limit=25` : "?limit=25"
      const res = await fetch(`/api/admin/users${qs}`, { cache: "no-store", headers: { "x-admin-email": adminEmail } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to search users")
      const hits = (data?.users || []).map((u: UserApiHit) => ({
        _id: String(u._id),
        email: String(u.email || ""),
        userName: String(u.userName || ""),
        role: typeof u.role === "string" ? u.role : undefined,
      })) as UserHit[]
      setAssignHits(hits)
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : "Failed to search users")
    } finally {
      setAssignLoading(false)
    }
  }

  const pickUser = async (u: UserHit) => {
    setAssignSelectedUser(u)
    setAssignError("")
    setAssignSuccess("")
    if (!adminEmail) return
    try {
      const res = await fetch(`/api/admin/users/${u._id}`, { cache: "no-store", headers: { "x-admin-email": adminEmail } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load user roles")
      const roleIds = Array.isArray(data?.user?.roles) ? data.user.roles.map((x: unknown) => String(x)) : []
      setAssignUserRoleIds(roleIds)
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : "Failed to load user roles")
      setAssignUserRoleIds([])
    }
  }

  const toggleAssignRole = (roleId: string) => {
    setAssignUserRoleIds((prev) => (prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]))
  }

  const saveAssignment = async () => {
    setAssignError("")
    setAssignSuccess("")
    if (!adminEmail) return setAssignError("Admin session not ready.")
    if (!assignSelectedUser?.email) return setAssignError("Pick a user first.")

    setAssignSaving(true)
    try {
      const res = await fetch("/api/admin/roles/set", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ email: assignSelectedUser.email, roleIds: assignUserRoleIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save assignment")
      setAssignSuccess("Roles updated for user.")
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : "Failed to save assignment")
    } finally {
      setAssignSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Roles</h1>
          <p className="text-sm text-gray-600">Manage RBAC roles, permissions, and assignments.</p>
          {adminEmail && (
            <p className="text-xs text-gray-500 mt-1">Signed in as <span className="font-semibold">{adminEmail}</span></p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAssign}
            className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
          >
            Assign roles
          </button>
          <button
            onClick={openCreate}
            className="px-3 py-2 text-sm rounded bg-[#8D2741] text-white"
          >
            Create role
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-[#FFF4F4] border border-[#F3CACA] rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EEE7DA] flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">All roles</p>
            <button
              onClick={loadRoles}
              disabled={loading}
              className="px-2 py-1 text-xs rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No roles found.</div>
            ) : (
              roles.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelectedRoleId(r._id)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F4EFE7] ${selectedRoleId === r._id ? "bg-[#F4EFE7]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-[#16161A]">{r.name}</div>
                    <div className="text-xs text-gray-500">{(r.permissions || []).length} perms</div>
                  </div>
                  {r.description ? (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">{r.description}</div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">No description</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl shadow">
          {!selectedRole ? (
            <div className="p-5 text-sm text-gray-500">Select a role to view details.</div>
          ) : (
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#16161A]">{selectedRole.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedRole.description || "No description."}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(selectedRole)}
                    className="px-3 py-2 text-xs rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteError("")
                      setDeleteOpen(true)
                    }}
                    className="px-3 py-2 text-xs rounded border border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Permissions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedRole.permissions || []).length ? (
                    selectedRole.permissions.map((p) => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded bg-gray-100 border text-gray-700">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">--</span>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email subscriptions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedRole.emailSubscriptions || []).length ? (
                    selectedRole.emailSubscriptions.map((e) => (
                      <span key={e} className="text-xs px-2 py-0.5 rounded bg-gray-100 border text-gray-700">
                        {e}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">--</span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4 text-xs text-gray-600">
                <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-lg p-3">
                  <div className="text-[11px] text-gray-500 uppercase tracking-wide">Role ID</div>
                  <div className="mt-1 font-mono break-all">{selectedRole._id}</div>
                </div>
                <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-lg p-3">
                  <div className="text-[11px] text-gray-500 uppercase tracking-wide">Created by</div>
                  <div className="mt-1 break-all">{selectedRole.createdBy || "--"}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role editor modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">{editorMode === "create" ? "Create role" : "Edit role"}</p>
                <h3 className="text-lg font-semibold text-[#16161A]">
                  {editorMode === "create" ? "New role" : editorForm.name || "Role"}
                </h3>
              </div>
              <button onClick={() => setEditorOpen(false)} className="text-sm text-gray-600 hover:text-gray-900">
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input
                  value={editorForm.name}
                  onChange={(e) => setEditorForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g. seo_specialist"
                />
                <p className="text-[11px] text-gray-500 mt-1">Role names should be stable and snake_case.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <input
                  value={editorForm.description}
                  onChange={(e) => setEditorForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="What can this role do?"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Permissions (one per line)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditorForm((p) => ({
                        ...p,
                        permissionsText: uniqTrimLines(p.permissionsText).join("\n"),
                      }))
                    }
                    className="text-[11px] px-2 py-1 rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                  >
                    Dedup
                  </button>
                </div>
                <textarea
                  value={editorForm.permissionsText}
                  onChange={(e) => setEditorForm((p) => ({ ...p, permissionsText: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm min-h-[180px]"
                  placeholder={"users:view\norders:view\nbanner:edit"}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {KNOWN_PERMISSIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setEditorForm((prev) => ({
                          ...prev,
                          permissionsText: uniqTrimLines(`${prev.permissionsText}\n${p}`).join("\n"),
                        }))
                      }
                      className="text-[11px] px-2 py-1 rounded bg-gray-100 border text-gray-700 hover:bg-gray-50"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email events (one per line)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditorForm((p) => ({
                        ...p,
                        emailSubsText: uniqTrimLines(p.emailSubsText).join("\n"),
                      }))
                    }
                    className="text-[11px] px-2 py-1 rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                  >
                    Dedup
                  </button>
                </div>
                <textarea
                  value={editorForm.emailSubsText}
                  onChange={(e) => setEditorForm((p) => ({ ...p, emailSubsText: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm min-h-[180px]"
                  placeholder={"order.created\nrefund.processed"}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {KNOWN_EMAIL_EVENTS.map((ev) => (
                    <button
                      key={ev}
                      type="button"
                      onClick={() =>
                        setEditorForm((prev) => ({
                          ...prev,
                          emailSubsText: uniqTrimLines(`${prev.emailSubsText}\n${ev}`).join("\n"),
                        }))
                      }
                      className="text-[11px] px-2 py-1 rounded bg-gray-100 border text-gray-700 hover:bg-gray-50"
                    >
                      + {ev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {editorError && <p className="mt-3 text-xs text-red-600">{editorError}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditorOpen(false)}
                className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveRole}
                disabled={editorSaving}
                className="px-3 py-2 text-sm rounded bg-[#8D2741] text-white disabled:opacity-50"
              >
                {editorSaving ? "Saving..." : "Save role"}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-gray-500">
              Uses: <span className="font-semibold">GET/POST/PATCH/DELETE</span> <span className="font-mono">/api/admin/roles</span>
            </p>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Delete role</p>
                <h3 className="text-lg font-semibold text-[#16161A]">{selectedRole.name}</h3>
              </div>
              <button onClick={() => setDeleteOpen(false)} className="text-sm text-gray-600 hover:text-gray-900">
                Close
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-700">
              This will remove the role and pull it from any user assignments.
            </p>
            {deleteError && <p className="mt-3 text-xs text-red-600">{deleteError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteRole}
                disabled={deleteLoading}
                className="px-3 py-2 text-sm rounded bg-red-600 text-white disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign roles modal */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Assignments</p>
                <h3 className="text-lg font-semibold text-[#16161A]">Assign roles to a user</h3>
              </div>
              <button onClick={() => setAssignOpen(false)} className="text-sm text-gray-600 hover:text-gray-900">
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Find user</p>
                <div className="flex gap-2">
                  <input
                    value={assignQuery}
                    onChange={(e) => setAssignQuery(e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder="Search by email, name, phone..."
                  />
                  <button
                    onClick={searchUsers}
                    disabled={assignLoading}
                    className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {assignLoading ? "Searching..." : "Search"}
                  </button>
                </div>
                <div className="mt-3 max-h-64 overflow-auto border rounded">
                  {assignHits.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No results yet.</div>
                  ) : (
                    <div className="divide-y">
                      {assignHits.map((u) => (
                        <button
                          key={u._id}
                          onClick={() => pickUser(u)}
                          className={`w-full text-left p-3 hover:bg-[#F4EFE7] ${assignSelectedUser?._id === u._id ? "bg-[#F4EFE7]" : ""}`}
                        >
                          <div className="font-semibold text-[#16161A]">{u.userName || "Unnamed"}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                          <div className="text-[11px] text-gray-500 mt-1">Base role: {u.role || "customer"}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Roles</p>
                {!assignSelectedUser ? (
                  <div className="text-sm text-gray-500">Pick a user to edit role assignments.</div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 mb-3">
                      Editing: <span className="font-semibold">{assignSelectedUser.email}</span>
                    </div>
                    <div className="max-h-64 overflow-auto space-y-2">
                      {roles.map((r) => (
                        <label key={r._id} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={assignUserRoleIds.includes(r._id)}
                            onChange={() => toggleAssignRole(r._id)}
                          />
                          <div>
                            <div className="text-sm font-semibold">{r.name}</div>
                            {r.description ? <div className="text-xs text-gray-600">{r.description}</div> : null}
                          </div>
                        </label>
                      ))}
                    </div>
                    {assignError && <p className="mt-3 text-xs text-red-600">{assignError}</p>}
                    {assignSuccess && <p className="mt-3 text-xs text-green-700">{assignSuccess}</p>}
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setAssignOpen(false)}
                        className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button
                        onClick={saveAssignment}
                        disabled={assignSaving || !assignSelectedUser}
                        className="px-3 py-2 text-sm rounded bg-[#8D2741] text-white disabled:opacity-50"
                      >
                        {assignSaving ? "Saving..." : "Save assignments"}
                      </button>
                    </div>
                    <p className="mt-3 text-[11px] text-gray-500">
                      Uses: <span className="font-semibold">POST</span> <span className="font-mono">/api/admin/roles/set</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
