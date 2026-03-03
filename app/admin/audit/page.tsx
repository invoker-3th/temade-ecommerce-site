"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"

type AuditLog = {
  _id: string
  action: string
  actorEmail: string
  createdAt: string
  targetEmail?: string
  targetId?: string
  targetName?: string
  metadata?: Record<string, unknown>
}

export default function AuditPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user?.email) return
    const fetchLogs = async () => {
      setLoading(true)
      setError("")
      try {
        const adminEmail = user.email.trim().toLowerCase()
        const res = await fetch("/api/admin/audit", {
          headers: { "x-admin-email": adminEmail },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load logs")
        setLogs(data.logs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load logs")
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [user?.email])

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Admin Logs</h1>
        <p className="text-sm text-gray-600">History of sensitive admin actions and role changes.</p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-[#FFF4F4] border border-[#F3CACA] rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-5">
        {loading ? (
          <p className="text-sm text-gray-500">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">No admin log entries yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l._id} className="rounded-lg border border-[#EEE7DA] p-3">
                <div className="text-sm font-semibold text-[#16161A]">{l.action}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Actor: {l.actorEmail} | {new Date(l.createdAt).toLocaleString()}
                </div>
                {(l.targetEmail || l.targetId || l.targetName) && (
                  <div className="text-xs text-gray-600 mt-1">
                    Target: {l.targetName || l.targetEmail || l.targetId}
                  </div>
                )}
                {l.metadata && (
                  <pre className="mt-2 text-[11px] bg-[#FBF7F3] border border-[#EEE7DA] rounded p-2 overflow-x-auto">
                    {JSON.stringify(l.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

