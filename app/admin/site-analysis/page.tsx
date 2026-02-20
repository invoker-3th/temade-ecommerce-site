"use client"

import { useEffect, useMemo, useState } from "react"

type SiteAnalysisData = {
  range: { startDate: string; endDate: string }
  posthog: {
    connected: boolean
    summary: null | {
      activeUsers: number
      sessions: number
      pageViews: number
      averageSessionDuration: number
    }
    topPages: Array<{ path: string; views: number }>
  }
  webVitals: {
    connected: boolean
    summary: null | {
      p75Lcp: number
      p75Cls: number
      p75Inp: number
      samples: number
    }
    series?: Array<{ date: string; lcp: number; cls: number; inp: number }>
  }
  gsc: {
    connected: boolean
    topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>
    sitemaps: Array<{ path: string; lastSubmitted?: string; lastDownloaded?: string }>
  }
  errors: string[]
}

type SeriesPoint = { date: string; lcp: number; cls: number; inp: number }

function buildPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return ""
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
}

function scaleSeries(
  series: SeriesPoint[],
  key: "lcp" | "cls" | "inp",
  width: number,
  height: number
) {
  const values = series.map((p) => p[key]).filter((v) => Number.isFinite(v))
  if (values.length === 0) return ""
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = series.length > 1 ? width / (series.length - 1) : width
  const points = series.map((p, idx) => {
    const value = p[key]
    const x = idx * step
    const y = height - ((value - min) / range) * height
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }
  })
  return buildPath(points)
}

const ranges = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "ytd", label: "YTD" },
]

export default function AdminSiteAnalysisPage() {
  const [range, setRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SiteAnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/site-analysis?range=${range}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load site analysis")
        const payload = await res.json()
        setData(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load site analysis")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [range])

  const lastUpdated = useMemo(() => {
    if (!data) return "Not connected"
    return `${data.range.startDate} → ${data.range.endDate}`
  }, [data])

  return (
    <div className="p-6 md:p-10 font-WorkSans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Site Analysis</h1>
          <p className="text-sm text-gray-600">SEO health and performance overview. Data updates with connected services.</p>
        </div>
        <div className="flex items-center gap-2">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-2 text-sm rounded border ${range === r.id ? "bg-[#CA6F86] text-white border-[#CA6F86]" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {r.label}
            </button>
          ))}
          <div className="text-xs text-gray-500 ml-2">Range: {lastUpdated}</div>
        </div>
      </div>

      {loading ? (
        <div>Loading site analysis...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Indexing</p>
              <p className="text-xl font-semibold mt-2">{data?.gsc.connected ? "Connected" : "Not Connected"}</p>
              <p className="text-sm text-gray-600 mt-1">Search Console coverage data appears once configured.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sitemap / Robots</p>
              <p className="text-xl font-semibold mt-2">{data?.gsc.sitemaps?.length ? "Submitted" : "Not Configured"}</p>
              <p className="text-sm text-gray-600 mt-1">Add `app/sitemap.ts` and `app/robots.ts` and submit to GSC.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Web Analytics</p>
              <p className="text-xl font-semibold mt-2">{data?.posthog.connected ? "Connected" : "Not Connected"}</p>
              <p className="text-sm text-gray-600 mt-1">PostHog provides users, sessions, and top pages.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Core Web Vitals</p>
              <p className="text-xl font-semibold mt-2">{data?.webVitals.connected ? "Connected" : "Not Connected"}</p>
              <p className="text-sm text-gray-600 mt-1">Surface LCP / CLS / INP after adding web-vitals tracking.</p>
              {data?.webVitals.summary && (
                <p className="text-xs text-gray-500 mt-2">
                  P75 LCP {data.webVitals.summary.p75Lcp} · CLS {data.webVitals.summary.p75Cls} · INP {data.webVitals.summary.p75Inp} ({data.webVitals.summary.samples} samples)
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mt-6">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Users</p>
              <p className="text-2xl font-semibold mt-2">{data?.posthog.summary?.activeUsers?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sessions</p>
              <p className="text-2xl font-semibold mt-2">{data?.posthog.summary?.sessions?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Page Views</p>
              <p className="text-2xl font-semibold mt-2">{data?.posthog.summary?.pageViews?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Session (sec)</p>
              <p className="text-2xl font-semibold mt-2">{Math.round(data?.posthog.summary?.averageSessionDuration || 0)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Top Landing Pages (PostHog)</p>
                <span className="text-xs text-gray-400">{data?.posthog.connected ? "Live" : "Awaiting PostHog"}</span>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                {(data?.posthog.topPages || []).length === 0 && (
                  <div className="text-sm text-gray-400">No data available.</div>
                )}
                {(data?.posthog.topPages || []).map((row) => (
                  <div key={row.path} className="flex items-center justify-between border-b pb-2">
                    <span className="truncate">{row.path}</span>
                    <span>{row.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Top Pages (GSC)</p>
                <span className="text-xs text-gray-400">{data?.gsc.connected ? "Live" : "Awaiting GSC"}</span>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                {(data?.gsc.topPages || []).length === 0 && (
                  <div className="text-sm text-gray-400">No data available.</div>
                )}
                {(data?.gsc.topPages || []).map((row) => (
                  <div key={row.page} className="flex items-center justify-between border-b pb-2">
                    <span className="truncate">{row.page}</span>
                    <span>{row.clicks.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sitemaps (GSC)</p>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                {(data?.gsc.sitemaps || []).length === 0 && (
                  <div className="text-sm text-gray-400">No sitemap data available.</div>
                )}
                {(data?.gsc.sitemaps || []).map((item) => (
                  <div key={item.path} className="border-b pb-2">
                    <div className="font-medium truncate">{item.path}</div>
                    <div className="text-xs text-gray-500">
                      Last submitted: {item.lastSubmitted || "--"} · Last downloaded: {item.lastDownloaded || "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Implementation Notes</p>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>Connect PostHog and GSC using API credentials.</p>
                <p>Ensure PostHog has event capture enabled for page views and sessions.</p>
                <p>Add sitemap and robots files to unlock indexing visibility.</p>
              </div>
              {(data?.errors || []).length > 0 && (
                <div className="mt-4 text-xs text-red-600 space-y-1">
                  {data?.errors.map((err, idx) => (
                    <div key={`${err}-${idx}`}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1 mt-6">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Core Web Vitals (P75)</p>
                <span className="text-xs text-gray-400">{data?.webVitals.connected ? "Live" : "Awaiting data"}</span>
              </div>
              {!data?.webVitals.series || data.webVitals.series.length === 0 ? (
                <div className="text-sm text-gray-400">No web vitals data available yet.</div>
              ) : (
                <div className="w-full">
                  <svg viewBox="0 0 600 200" className="w-full h-52">
                    <path
                      d={scaleSeries(data.webVitals.series, "lcp", 600, 160)}
                      fill="none"
                      stroke="#8D2741"
                      strokeWidth="2"
                    />
                    <path
                      d={scaleSeries(data.webVitals.series, "cls", 600, 160)}
                      fill="none"
                      stroke="#2C2C2C"
                      strokeWidth="2"
                    />
                    <path
                      d={scaleSeries(data.webVitals.series, "inp", 600, 160)}
                      fill="none"
                      stroke="#CA6F86"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-2">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#8D2741]" />
                      LCP
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#2C2C2C]" />
                      CLS
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#CA6F86]" />
                      INP
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
