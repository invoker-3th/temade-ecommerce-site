type PosthogCapturePayload = {
  event: string
  distinctId: string
  properties?: Record<string, unknown>
  timestamp?: string
}

function normalizeHost(host: string) {
  return host.replace(/\/+$/, "")
}

function getPosthogIngestHost() {
  const explicitIngest = process.env.POSTHOG_INGEST_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (explicitIngest) return normalizeHost(explicitIngest)

  const host = normalizeHost(process.env.POSTHOG_HOST || "")
  if (host.includes("eu.posthog.com")) return "https://eu.i.posthog.com"
  return "https://us.i.posthog.com"
}

function getPosthogProjectKey() {
  return process.env.POSTHOG_PROJECT_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || ""
}

export async function capturePosthogServerEvent(payload: PosthogCapturePayload) {
  const apiKey = getPosthogProjectKey()
  if (!apiKey) return

  const host = getPosthogIngestHost()
  const body = {
    api_key: apiKey,
    event: payload.event,
    distinct_id: payload.distinctId,
    timestamp: payload.timestamp || new Date().toISOString(),
    properties: {
      ...payload.properties,
      $lib: "temade-server",
    },
  }

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  } catch (error) {
    console.error("PostHog server capture failed:", error)
  }
}

