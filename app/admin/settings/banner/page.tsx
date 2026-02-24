"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"

const DEFAULT_MESSAGE = "Shop New Arrivals on TemAde today!"
const MAX_LENGTH = 180

export default function AdminBannerSettingsPage() {
  const { user } = useAuth()
  const adminEmail = user?.email?.trim().toLowerCase() || ""

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!adminEmail) {
      setLoading(false)
      return
    }

    const run = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/admin/site-content/top-bar", {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload?.error || "Failed to load banner settings")
        const nextMessage = String(payload?.message || "").trim()
        setMessage(nextMessage || DEFAULT_MESSAGE)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load banner settings")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [adminEmail])

  const save = async () => {
    setError("")
    setSuccess("")
    const trimmed = message.trim()
    if (!trimmed) {
      setError("Banner text is required.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-content/top-bar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail,
        },
        body: JSON.stringify({ message: trimmed }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "Failed to save banner settings")
      setMessage(String(payload?.message || trimmed))
      setSuccess("Banner text saved.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save banner settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Banner Settings</h1>
        <p className="text-sm text-gray-600">Edit the top promo banner text shown across the site.</p>
      </div>

      <div className="bg-white rounded-xl shadow p-5 max-w-3xl">
        {loading ? (
          <p className="text-sm text-gray-500">Loading banner settings...</p>
        ) : (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Top Banner Text</label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm min-h-[96px]"
              value={message}
              maxLength={MAX_LENGTH}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={DEFAULT_MESSAGE}
            />
            <p className="text-xs text-gray-500 mt-2">{message.trim().length}/{MAX_LENGTH}</p>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            {success && <p className="text-xs text-green-600 mt-2">{success}</p>}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={save}
                disabled={saving || !adminEmail}
                className="px-4 py-2 text-sm rounded bg-[#8D2741] text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Banner"}
              </button>
              <button
                onClick={() => setMessage(DEFAULT_MESSAGE)}
                type="button"
                className="px-4 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
              >
                Reset to Default
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
