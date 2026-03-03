"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useAuth } from "@/app/context/AuthContext"

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
  const { user } = useAuth()
  const adminEmail = user?.email?.trim().toLowerCase() || ""
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<PageRow>(emptyPage)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "instructions" | "examples">("edit")
  const [promptSelection, setPromptSelection] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [showGallery, setShowGallery] = useState(false)

  const promptLibrary = useMemo(
    () => [
      "Write a Shipping Policy for Temade Studios: processing times, shipping options, delivery windows, and handling delays.",
      "Create a Returns & Exchanges policy with eligibility window, item condition rules, refund method, and steps.",
      "Write an About Us page: brand mission, craftsmanship, materials, and founder story in a refined tone.",
      "Draft a Privacy Policy page with data collection, cookies, marketing, and user rights.",
      "Create a Terms of Service page for a luxury fashion brand.",
      "Write a FAQ page covering sizing, shipping, returns, care, and contact.",
      "Create a Holiday Campaign landing page with headline, intro, 3 product highlights, and CTA.",
      "Write a Sustainability page explaining materials, ethical sourcing, and longevity.",
      "Create a Care Guide page for premium garments and accessories.",
      "Draft a Press page with brand bio and media contact details.",
      "Write a Wholesale / Stockists page with inquiry CTA.",
      "Create a Size Guide page with measurements and fit notes.",
      "Write a Gift Guide page with 5 product themes and CTA.",
      "Create a Limited Drop page with urgency and waitlist CTA.",
      "Write a New Arrivals page with short intro and featured list.",
      "Create a Best Sellers page with 6 product highlights and CTA.",
      "Write a Lookbook page describing a seasonal story.",
      "Create a VIP / Loyalty page with benefits and how to join.",
      "Draft a Collaboration page featuring a partner brand.",
      "Write a Store Locator page with city list and contact.",
      "Create a Brand Values page: quality, heritage, exclusivity.",
      "Write a Returns FAQ with edge cases (sale items, worn items).",
      "Create a Shipping FAQ with international duties and tracking.",
      "Write a Contact page with response times and channels.",
      "Create a Custom Orders page with timelines and deposits.",
      "Write a Fabric Guide page explaining silk, linen, cotton.",
      "Create a Styling Tips page for core products.",
      "Write a Gift Card page with how it works.",
      "Create a Bridal / Occasion page for special events.",
      "Write a Product Warranty page if applicable.",
      "Create a Preorder page explaining timelines and updates.",
      "Write a Restock page with sign-up CTA.",
      "Create a Trade Program page for stylists and editors.",
      "Write a Returns page for international customers.",
      "Create a Press Kit page with downloadable assets.",
      "Write a Brand Story timeline page (year by year).",
      "Create a “How it’s made” page with atelier details.",
      "Write a Founder’s Letter page with personal note.",
      "Create a Charity / Impact page with annual goals.",
      "Write a Corporate Gifting page with inquiry CTA.",
      "Create a Collection launch page with inspiration and CTA.",
      "Write a Membership page with tiers and perks.",
      "Create a “Care & Repair” page for long-term use.",
      "Write a Gift Wrapping page with options and pricing.",
      "Create a Returns policy for custom items only.",
      "Write a Loyalty points explanation page.",
      "Create a seasonal sale landing page.",
      "Write a “Made in Nigeria” heritage page.",
      "Create a “Materials & Sourcing” deep dive page.",
      "Write an Influencer Program page.",
      "Create a “Stylist Picks” editorial page.",
      "Write a “Customer Stories” page with testimonials.",
      "Create a “Press Features” page listing publications.",
      "Write a “Shipping to US/UK/EU” page with zones.",
      "Create a “Gift Sets” page with bundles.",
      "Write a “Returns for Gift Orders” page.",
      "Create a “Student Discount” page with verification steps.",
      "Write a “Packaging” page describing premium packaging.",
      "Create a “Care for Leather” page.",
      "Write a “Care for Knitwear” page.",
      "Create a “Lookbook: Winter” page with mood and CTA.",
      "Write a “Lookbook: Summer” page with mood and CTA.",
    ],
    []
  )

  const selected = useMemo(
    () => pages.find((p) => p._id === selectedId) || null,
    [pages, selectedId]
  )

  const loadPages = useCallback(async () => {
    if (!adminEmail) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/pages", { cache: "no-store", headers: { "x-admin-email": adminEmail } })
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
  }, [adminEmail, selectedId])

  useEffect(() => {
    loadPages()
  }, [loadPages])

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
    setActiveTab("edit")
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
          headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update page")
      } else {
        const res = await fetch("/api/admin/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
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
      const res = await fetch(`/api/admin/pages/${selectedId}`, { method: "DELETE", headers: { "x-admin-email": adminEmail } })
      if (!res.ok) throw new Error("Failed to delete page")
      setSelectedId(null)
      setForm(emptyPage)
      await loadPages()
    } catch (error) {
      console.error(error)
      alert("Failed to delete page")
    }
  }

  const handleCopy = async (value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = value
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
  }

  const appendImageTag = (url: string) => {
    setForm((prev) => ({
      ...prev,
      content: `${prev.content || ""}\n<img src="${url}" alt="Product image" />\n`,
    }))
  }

  const onUploadImages = async (files: File[]) => {
    if (!files.length) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append("files", file))
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-email": adminEmail },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Upload failed")
      }
      const data = await res.json()
      const urls = Array.isArray(data?.urls) ? (data.urls as string[]) : []
      if (!urls.length) throw new Error("Upload succeeded but no URLs returned")
      setUploadedImages((prev) => Array.from(new Set([...urls, ...prev])))
      urls.forEach((url) => appendImageTag(url))
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploadingImage(false)
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

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-[#EEE7DA] pb-4 mb-6">
            <button
              onClick={() => setActiveTab("edit")}
              className={`w-full sm:w-auto px-3 py-2 text-sm rounded ${activeTab === "edit" ? "bg-[#2C2C2C] text-white" : "border border-[#EEE7DA] text-gray-700"}`}
            >
              Edit
            </button>
            <button
              onClick={() => setActiveTab("instructions")}
              className={`w-full sm:w-auto px-3 py-2 text-sm rounded ${activeTab === "instructions" ? "bg-[#2C2C2C] text-white" : "border border-[#EEE7DA] text-gray-700"}`}
            >
              Instructions
            </button>
            <button
              onClick={() => setActiveTab("examples")}
              className={`w-full sm:w-auto px-3 py-2 text-sm rounded ${activeTab === "examples" ? "bg-[#2C2C2C] text-white" : "border border-[#EEE7DA] text-gray-700"}`}
            >
              Examples
            </button>
          </div>

          {activeTab === "edit" ? (
            <div className="space-y-6">
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
                  className="border p-3 rounded w-full min-h-[220px]"
                  value={form.content || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  <p className="text-xs text-gray-500">
                    You can paste HTML here (including &lt;img&gt; tags) to add product images.
                  </p>
                  <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded border border-[#EEE7DA] bg-white hover:bg-gray-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length) onUploadImages(files)
                        e.currentTarget.value = ""
                      }}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? "Uploading..." : "Upload images"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGallery((prev) => !prev)}
                    className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded border border-[#EEE7DA] bg-white hover:bg-gray-50"
                  >
                    {showGallery ? "Hide gallery" : "Open gallery"}
                  </button>
                </div>

                {showGallery && (
                  <div className="mt-3 border border-[#EEE7DA] rounded-lg p-3 bg-[#FFFBEB]">
                    {uploadedImages.length === 0 ? (
                      <div className="text-xs text-gray-500">No uploaded images yet.</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {uploadedImages.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => appendImageTag(url)}
                            className="border rounded-lg overflow-hidden bg-white hover:shadow"
                            title="Click to insert into content"
                          >
                            <Image
                              src={url}
                              alt="Uploaded"
                              width={160}
                              height={96}
                              className="w-full h-24 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">Live Preview</h2>
                <div
                  className="border rounded-lg p-4 bg-[#FFFBEB] prose max-w-none text-gray-800 overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: (form.content || "").includes("<")
                      ? (form.content || "")
                      : (form.content || "").replace(/\n/g, "<br />"),
                  }}
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
          ) : activeTab === "instructions" ? (
            <div className="space-y-6 text-sm text-gray-700 w-full">
              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">Step‑by‑step: Create a new marketing page</h2>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Click “Create Page” (or the “New” button in the CMS Pages screen).</li>
                  <li><span className="font-semibold">Title</span>: Enter the page title (e.g., “Shipping Policy”).</li>
                  <li><span className="font-semibold">Slug</span>: Enter a URL slug (e.g., <code>shipping-policy</code>).</li>
                  <li>This becomes the URL: <span className="font-semibold">https://your-domain.com/shipping-policy</span>.</li>
                  <li>If you leave the slug empty, the system auto‑generates one from the title.</li>
                  <li><span className="font-semibold">Content</span>: Write the page content.</li>
                  <li><span className="font-semibold">Excerpt (optional)</span>: Short summary used as fallback meta description.</li>
                  <li><span className="font-semibold">SEO fields (optional but recommended)</span>:
                    Meta Title, Meta Description, Canonical URL, OG Image, JSON‑LD.</li>
                  <li><span className="font-semibold">Status</span>:
                    Draft = not public, Published = public.</li>
                  <li>Click <span className="font-semibold">Save / Publish</span>.</li>
                </ol>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">Step‑by‑step: Edit a page</h2>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Go to <span className="font-semibold">Admin → CMS Pages</span>.</li>
                  <li>Select the page from the list.</li>
                  <li>Update any fields.</li>
                  <li>Click <span className="font-semibold">Save</span>.</li>
                </ol>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">Step‑by‑step: Delete a page</h2>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Go to <span className="font-semibold">Admin → CMS Pages</span>.</li>
                  <li>Select the page.</li>
                  <li>Click <span className="font-semibold">Delete</span>.</li>
                  <li>Confirm.</li>
                </ol>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">How pages are rendered</h2>
                <p>Public pages are rendered by <code>app/(public)/[slug]/page.tsx</code>.</p>
                <p>Only pages with status <code>published</code> are visible to the public.</p>
                <p>Draft pages are not accessible by URL.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">What types of pages can be created</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div>About Us</div>
                  <div>Shipping Policy</div>
                  <div>Returns &amp; Exchanges</div>
                  <div>Privacy Policy</div>
                  <div>Terms of Service</div>
                  <div>FAQs</div>
                  <div>Campaign landing pages (e.g., “Holiday 2026 Drop”)</div>
                  <div>Press pages</div>
                  <div>Partner pages</div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">SEO metadata support</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div>Meta Title</div>
                  <div>Meta Description</div>
                  <div>Canonical URL</div>
                  <div>Open Graph Image</div>
                  <div>JSON‑LD (structured data)</div>
                </div>
                <p className="mt-2">These fields are applied automatically when the page loads.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">How to access the page after publishing</h2>
                <p>If you set:</p>
                <p><span className="font-semibold">Title:</span> Shipping Policy</p>
                <p><span className="font-semibold">Slug:</span> shipping-policy</p>
                <p>Then the page URL is:</p>
                <p className="font-semibold">https://your-domain.com/shipping-policy</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">Add product images</h2>
                <p>Paste an image tag in the Content field. Use a full image URL (Cloudinary or any hosted image).</p>
                <pre className="bg-[#F7F3EE] text-xs p-3 rounded border border-[#EEE7DA] overflow-x-auto">
{`<img src="https://res.cloudinary.com/your-cloud/image/upload/v123/product.jpg" alt="Product name" />`}
                </pre>
                <p>You can also add links to products:</p>
                <pre className="bg-[#F7F3EE] text-xs p-3 rounded border border-[#EEE7DA] overflow-x-auto">
{`<a href="/shop/PRODUCT_ID">Shop this product</a>`}
                </pre>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">Notes / Best Practices</h2>
                <div className="space-y-1">
                  <div>Keep slugs short and hyphenated.</div>
                  <div>Use unique Meta Titles and Descriptions.</div>
                  <div>For campaign pages, add Open Graph images to improve sharing.</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-sm text-gray-700 w-full">
              <div>
                <h2 className="text-lg font-semibold text-[#16161A] mb-2">Example Prompts For CMS Pages</h2>
                <p>Copy these prompts into your content draft process and paste the results into the CMS Content field.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] items-end">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Prompt Generator</label>
                    <select
                      className="border p-3 rounded w-full"
                      value={promptSelection}
                      onChange={(e) => setPromptSelection(e.target.value)}
                    >
                      <option value="">Select a prompt template</option>
                      {promptLibrary.map((prompt) => (
                        <option key={prompt} value={prompt}>
                          {prompt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleCopy(promptSelection)}
                    disabled={!promptSelection}
                    className="px-3 py-2 text-sm rounded bg-[#2C2C2C] text-white disabled:opacity-50"
                  >
                    Copy prompt
                  </button>
                </div>
                {promptSelection && (
                  <div className="mt-3 border border-[#EEE7DA] rounded-lg p-3 bg-[#FFFBEB] text-xs">
                    {promptSelection}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {promptLibrary.slice(0, 5).map((prompt, idx) => (
                  <div key={prompt} className="border border-[#EEE7DA] rounded-lg p-4 bg-[#FFFBEB]">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Example {idx + 1}</p>
                      <button
                        onClick={() => handleCopy(prompt)}
                        className="text-xs px-2 py-1 rounded border border-[#EEE7DA] bg-white hover:bg-gray-50"
                      >
                        Copy
                      </button>
                    </div>
                    <p>{prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

