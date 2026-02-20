"use client"

import { useEffect } from "react"

type WebVitalMetric = {
  id: string
  name: string
  value: number
  delta: number
  rating: string
  navigationType?: string
}

function sendMetric(metric: WebVitalMetric) {
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    url: window.location.href,
    path: window.location.pathname,
    userAgent: navigator.userAgent,
  })

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" })
    navigator.sendBeacon("/api/web-vitals", blob)
    return
  }

  fetch("/api/web-vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => null)
}

export default function WebVitalsClient() {
  useEffect(() => {
    let cleanup = false
    ;(async () => {
      const { onCLS, onINP, onLCP } = await import("web-vitals")
      if (cleanup) return
      onCLS(sendMetric)
      onINP(sendMetric)
      onLCP(sendMetric)
    })()

    return () => {
      cleanup = true
    }
  }, [])

  return null
}
