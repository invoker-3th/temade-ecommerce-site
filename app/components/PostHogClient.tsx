"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

const CONSENT_KEY = "cookie_consent"

export default function PostHogClient() {
  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent !== "accepted") return

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
    if (!apiKey) return

    posthog.init(apiKey, {
      api_host: apiHost,
      defaults: "2026-01-30",
    })
  }, [])

  return null
}
