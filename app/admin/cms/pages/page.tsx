"use client"

import { useEffect, useMemo, useState } from "react"

type PageRow = {
  _id: string
  title: string
  slug: string
  status: "draft" | "published"
  excerpt?: string
  content?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
    ogImage?: string
    schemaJsonLd?: string
  }
  updatedAt?: string
}

const emptyPage: PageRow = {
  _id: "",
  title: "",
  slug: "",
  status: "draft",
  excerpt: "",
  content: "",
  seo: {
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImage: "",
    schemaJsonLd: "",
  },
}

export default function AdminCmsPages() {
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<PageRow>(emptyPage)
  const [saving, setSaving] = useState(false)

  const selected = useMemo(
    () => pages.find((p) => p._id === selectedId) || null,
    [pages, selectedId]
  )

  const loadPages = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/pages", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load pages")
      const data = await res.json()
      setPages(data.pages || [])
      if (data.pages?.length && !selectedId) {
        setSelectedId(data.pages[0]._id)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
  }, [])

  useEffect(() => {
    if (selected) {
      setForm({
        ...selected,
        seo: {
          metaTitle: selected.seo?.metaTitle || "",
          metaDescription: selected.seo?.metaDescription || "",
          canonicalUrl: selected.seo?.canonicalUrl || "",
          ogImage: selected.seo?.ogImage || "",
          schemaJsonLd: selected.seo?.schemaJsonLd || "",
        },
      })
    }
  }, [selected])

  const onCreateNew = () => {
    setSelectedId(null)
    setForm(emptyPage)
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        status: form.status,
        excerpt: form.excerpt,
        content: form.content,
        seo: form.seo,
      }

      if (selectedId) {
        const res = await fetch(`/api/admin/pages/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update page")
      } else {
        const res = await fetch("/api/admin/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create page")
      }

      await loadPages()
    } catch (error) {
      console.error(error)
      alert("Failed to save page")
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!selectedId) return
    if (!confirm("Delete this page?")) return
    try {
      const res = await fetch(`/api/admin/pages/${selectedId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete page")
      setSelectedId(null)
      setForm(emptyPage)
      await loadPages()
    } catch (error) {
      console.error(error)
      alert("Failed to delete page")
    }
  }

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">CMS Pages</h1>
          <p className="text-sm text-gray-600">Create marketing pages and manage SEO metadata.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateNew}
            className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
          >
            New Page
          </button>
          {selectedId && (
            <button
              onClick={onDelete}
              className="px-3 py-2 text-sm rounded border border-red-200 text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-2 text-sm rounded bg-[#2C2C2C] text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <div className="bg-white rounded-xl shadow divide-y">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading pages...</div>
          ) : pages.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No pages yet.</div>
          ) : (
            pages.map((page) => (
              <button
                key={page._id}
                onClick={() => setSelectedId(page._id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-[#F4EFE7] ${selectedId === page._id ? "bg-[#F4EFE7]" : ""}`}
              >
                <div className="font-semibold text-[#16161A]">{page.title}</div>
                <div className="text-xs text-gray-500">/{page.slug} · {page.status}</div>
              </button>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
              <input
                className="border p-3 rounded w-full"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
              <input
                className="border p-3 rounded w-full"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                className="border p-3 rounded w-full"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "draft" | "published" }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Excerpt</label>
              <input
                className="border p-3 rounded w-full"
                value={form.excerpt || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
            <textarea
              className="border p-3 rounded w-full min-h-[180px]"
              value={form.content || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#16161A] mb-4">SEO Metadata</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Title</label>
                <input
                  className="border p-3 rounded w-full"
                  value={form.seo?.metaTitle || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, metaTitle: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
                <input
                  className="border p-3 rounded w-full"
                  value={form.seo?.metaDescription || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Canonical URL</label>
                <input
                  className="border p-3 rounded w-full"
                  value={form.seo?.canonicalUrl || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, canonicalUrl: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Open Graph Image</label>
                <input
                  className="border p-3 rounded w-full"
                  value={form.seo?.ogImage || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, ogImage: e.target.value } }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Schema (JSON-LD)</label>
              <textarea
                className="border p-3 rounded w-full min-h-[140px]"
                value={form.seo?.schemaJsonLd || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, schemaJsonLd: e.target.value } }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
