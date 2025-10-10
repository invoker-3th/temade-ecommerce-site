"use client"
import React, { useEffect, useMemo, useState } from "react"
import FileUploadZone from "@/app/components/FileUploadZone"

type LookbookSection = {
  material: string
  images: string[]
}

export default function AdminLookbookPage() {
  const [sections, setSections] = useState<LookbookSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  const [newMaterial, setNewMaterial] = useState<string>("")

  const materials = useMemo(() => Array.from(new Set(sections.map(s => s.material))), [sections])

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch('/api/lookbook', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load lookbook')
      const data = await res.json()
      setSections(data.sections || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lookbook')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleUploadSuccess = async (urls: string[]) => {
    const material = (newMaterial?.trim() || selectedMaterial)?.trim()
    if (!material) {
      setError('Select or enter a material before uploading')
      return
    }
    setError("")
    setSuccess("")
    try {
      for (const url of urls) {
        const res = await fetch('/api/admin/lookbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ material, image: url })
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to save lookbook image')
        }
      }
      setSuccess(`${urls.length} image(s) added to ${material}`)
      setNewMaterial("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add images')
    }
  }

  const handleUploadError = (err: string) => {
    setError(err)
  }

  const handleDelete = async (material: string, image: string) => {
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`/api/admin/lookbook?material=${encodeURIComponent(material)}&image=${encodeURIComponent(image)}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete image')
      }
      setSuccess('Image deleted')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete image')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Lookbook Manager</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 bg-white rounded-xl shadow p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Material</label>
            <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">— Select existing —</option>
              {materials.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Or Create New Material</label>
            <input value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} placeholder="e.g., COTTON - ADIRE" className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload Images (Cloudinary)</label>
            <FileUploadZone onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} maxFiles={10} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}
        </div>

        <div className="md:col-span-2">
          {loading ? (
            <div>Loading...</div>
          ) : sections.length === 0 ? (
            <div className="text-gray-600">No lookbook sections yet.</div>
          ) : (
            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.material} className="bg-white rounded-xl shadow p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-[#16161A]">{section.material}</h2>
                    <span className="text-sm text-gray-500">{section.images.length} image(s)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {section.images.map((img) => (
                      <div key={img} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={section.material} className="w-full h-32 object-cover rounded" />
                        <button onClick={() => handleDelete(section.material, img)} className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

