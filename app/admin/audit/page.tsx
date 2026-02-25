"use client"

import { useEffect, useState } from "react"

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
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/audit', { headers: { 'x-admin-email': (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') as string).email) || '' } })
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setLogs(data.logs || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Audit Logs</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l._id} className="bg-white p-3 rounded border">
              <div className="text-sm"><strong>{l.action}</strong> — {l.actorEmail}</div>
              <div className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()}</div>
              {l.targetEmail && <div className="text-xs">Target: {l.targetEmail}</div>}
              {l.metadata && <div className="text-xs text-gray-600">{JSON.stringify(l.metadata)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
