"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"

const CONSENT_KEY = "cookie_consent"

export default function PostHogClient() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent !== "accepted") return

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
    if (!apiKey) return

    posthog.init(apiKey, {
      api_host: apiHost,
      defaults: "2026-01-30",
      capture_pageview: false,
    })
  }, [])

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent !== "accepted") return

    const query = searchParams?.toString()
    const fullPath = query ? `${pathname}?${query}` : pathname
    posthog.capture("$pageview", {
      pathname: fullPath,
      page_title: document.title,
      referrer: document.referrer || "",
    })
  }, [pathname, searchParams])

  return null
}
