import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"

type SiteAnalysisResponse = {
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
  gsc: {
    connected: boolean
    topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>
    sitemaps: Array<{ path: string; lastSubmitted?: string; lastDownloaded?: string }>
  }
  errors: string[]
}

function getDateRange(range: string) {
  const now = new Date()
  let start = new Date(now)
  switch (range) {
    case "7d":
      start.setDate(now.getDate() - 6)
      break
    case "30d":
      start.setDate(now.getDate() - 29)
      break
    case "90d":
      start.setDate(now.getDate() - 89)
      break
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1)
      break
    default:
      start.setDate(now.getDate() - 29)
  }
  const toDate = (date: Date) => date.toISOString().slice(0, 10)
  return { startDate: toDate(start), endDate: toDate(now) }
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url")
}

async function getAccessToken(scopes: string[]) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!clientEmail || !privateKey) return null

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 60 * 60,
  }
  const header = { alg: "RS256", typ: "JWT" }
  const encodedHeader = base64Url(JSON.stringify(header))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const signer = crypto.createSign("RSA-SHA256")
  signer.update(unsignedToken)
  signer.end()
  const signature = signer.sign(privateKey, "base64url")
  const jwt = `${unsignedToken}.${signature}`

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  })

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.access_token as string | undefined
}

function normalizeHost(host: string) {
  return host.replace(/\/+$/, "")
}

async function runPosthogQuery(posthogHost: string, projectId: string, apiKey: string, query: string) {
  const res = await fetch(`${posthogHost}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "PostHog query failed")
  }

  const data = await res.json()
  return data?.results as Array<Array<unknown>> | undefined
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get("range") || "30d"
  const { startDate, endDate } = getDateRange(range)

  const response: SiteAnalysisResponse = {
    range: { startDate, endDate },
    posthog: { connected: false, summary: null, topPages: [] },
    gsc: { connected: false, topPages: [], sitemaps: [] },
    errors: [],
  }

  const posthogProjectId = process.env.POSTHOG_PROJECT_ID
  const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const posthogHostRaw = process.env.POSTHOG_HOST || "https://app.posthog.com"
  const posthogHost = normalizeHost(posthogHostRaw)

  if (posthogProjectId && posthogApiKey) {
    try {
      const startDateTime = `${startDate} 00:00:00`
      const endDateTime = `${endDate} 23:59:59`

      const [activeUsersRows, pageViewsRows, sessionsRows, avgSessionRows, topPagesRows] = await Promise.all([
        runPosthogQuery(
          posthogHost,
          posthogProjectId,
          posthogApiKey,
          `select count(DISTINCT distinct_id) from events where event = '$pageview' and timestamp >= toDateTime('${startDateTime}') and timestamp <= toDateTime('${endDateTime}')`
        ),
        runPosthogQuery(
          posthogHost,
          posthogProjectId,
          posthogApiKey,
          `select count() from events where event = '$pageview' and timestamp >= toDateTime('${startDateTime}') and timestamp <= toDateTime('${endDateTime}')`
        ),
        runPosthogQuery(
          posthogHost,
          posthogProjectId,
          posthogApiKey,
          `select count() from events where event = '$session_start' and timestamp >= toDateTime('${startDateTime}') and timestamp <= toDateTime('${endDateTime}')`
        ),
        runPosthogQuery(
          posthogHost,
          posthogProjectId,
          posthogApiKey,
          `select avg(toFloat(properties.$session_duration)) from events where event = '$session_end' and properties.$session_duration is not null and timestamp >= toDateTime('${startDateTime}') and timestamp <= toDateTime('${endDateTime}')`
        ),
        runPosthogQuery(
          posthogHost,
          posthogProjectId,
          posthogApiKey,
          `select coalesce(nullIf(properties.$pathname, ''), nullIf(properties.$current_url, ''), 'unknown') as path, count() as views from events where event = '$pageview' and timestamp >= toDateTime('${startDateTime}') and timestamp <= toDateTime('${endDateTime}') group by path order by views desc limit 10`
        ),
      ])

      response.posthog.summary = {
        activeUsers: Number(activeUsersRows?.[0]?.[0] || 0),
        sessions: Number(sessionsRows?.[0]?.[0] || 0),
        pageViews: Number(pageViewsRows?.[0]?.[0] || 0),
        averageSessionDuration: Math.round(Number(avgSessionRows?.[0]?.[0] || 0)),
      }
      response.posthog.topPages = (topPagesRows || []).map((row) => ({
        path: String(row?.[0] || "-"),
        views: Number(row?.[1] || 0),
      }))
      response.posthog.connected = true
    } catch (error) {
      response.errors.push("PostHog analytics request failed")
    }
  } else {
    response.errors.push("PostHog credentials are missing or invalid")
  }

  const scopes = ["https://www.googleapis.com/auth/webmasters.readonly"]

  let accessToken: string | null = null
  try {
    accessToken = await getAccessToken(scopes)
  } catch (error) {
    response.errors.push("Failed to authenticate with Google APIs")
  }

  if (accessToken) {
    const gscSiteUrl = process.env.GSC_SITE_URL
    if (gscSiteUrl) {
      try {
        const res = await fetch(
          `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate,
              endDate,
              dimensions: ["page"],
              rowLimit: 10,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          response.gsc.topPages = (data?.rows || []).map((row: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
            page: row.keys?.[0] || "-",
            clicks: Number(row.clicks || 0),
            impressions: Number(row.impressions || 0),
            ctr: Number(row.ctr || 0),
            position: Number(row.position || 0),
          }))
          response.gsc.connected = true
        } else {
          response.errors.push("GSC search analytics request failed")
        }
      } catch (error) {
        response.errors.push("GSC search analytics request failed")
      }

      try {
        const res = await fetch(
          `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/sitemaps`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        )

        if (res.ok) {
          const data = await res.json()
          response.gsc.sitemaps = (data?.sitemap || []).map((item: { path: string; lastSubmitted?: string; lastDownloaded?: string }) => ({
            path: item.path,
            lastSubmitted: item.lastSubmitted,
            lastDownloaded: item.lastDownloaded,
          }))
          response.gsc.connected = true
        } else {
          response.errors.push("GSC sitemap request failed")
        }
      } catch (error) {
        response.errors.push("GSC sitemap request failed")
      }
    }
  } else {
    response.errors.push("Google API credentials are missing or invalid")
  }

  return NextResponse.json(response)
}
