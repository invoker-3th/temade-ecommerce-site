"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"

type SeoHealth = {
  sitemap?: { url: string; status: number | null; ok: boolean }
  robots?: { url: string; status: number | null; ok: boolean }
}

type SeoApiResponse = {
  gsc?: {
    connected: boolean
    topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>
    sitemaps: Array<{ path: string; lastSubmitted?: string; lastDownloaded?: string }>
  }
  technicalSeo?: SeoHealth
  errors?: string[]
}

export default function AdminSeoSettingsPage() {
  const { user } = useAuth()
  const adminEmail = user?.email?.trim().toLowerCase() || ""
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SeoApiResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!adminEmail) return
    const run = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/admin/site-analysis?range=30d", {
          cache: "no-store",
          headers: { "x-admin-email": adminEmail },
        })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload?.error || "Failed to load SEO settings")
        setData(payload)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load SEO settings")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [adminEmail])

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">SEO Settings</h1>
        <p className="text-sm text-gray-600">Technical SEO and Search Console readiness for your site.</p>
      </div>

      {loading ? (
        <div>Loading SEO settings...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Google Search Console</p>
              <p className="text-xl font-semibold mt-2">
                {data?.gsc?.connected ? "Connected" : "Not Connected"}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sitemap</p>
              <p className="text-xl font-semibold mt-2">
                {data?.technicalSeo?.sitemap?.ok ? "Configured" : "Not Configured"}
              </p>
              {data?.technicalSeo?.sitemap?.url && (
                <a
                  href={data.technicalSeo.sitemap.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#8D2741] underline mt-2 inline-block"
                >
                  Open sitemap.xml
                </a>
              )}
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Robots</p>
              <p className="text-xl font-semibold mt-2">
                {data?.technicalSeo?.robots?.ok ? "Configured" : "Not Configured"}
              </p>
              {data?.technicalSeo?.robots?.url && (
                <a
                  href={data.technicalSeo.robots.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#8D2741] underline mt-2 inline-block"
                >
                  Open robots.txt
                </a>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm font-semibold text-[#16161A] mb-2">Sitemaps in GSC</p>
            {!data?.gsc?.sitemaps?.length ? (
              <p className="text-sm text-gray-500">
                No submitted sitemap found in GSC yet. Submit your sitemap URL in Search Console.
              </p>
            ) : (
              <div className="space-y-2">
                {data.gsc.sitemaps.map((s) => (
                  <div key={s.path} className="border border-[#EEE7DA] rounded p-2 text-sm">
                    <p className="font-medium">{s.path}</p>
                    <p className="text-xs text-gray-500">
                      Last submitted: {s.lastSubmitted || "--"} | Last downloaded: {s.lastDownloaded || "--"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!!data?.errors?.length && (
            <div className="bg-[#FFF4F4] border border-[#F3CACA] rounded-xl p-4">
              <p className="text-sm font-semibold text-[#8D2741] mb-1">SEO Connection Errors</p>
              <div className="text-xs text-red-700 space-y-1">
                {data.errors.map((item, idx) => (
                  <div key={`${item}-${idx}`}>{item}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

