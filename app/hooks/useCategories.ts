"use client"

import { useEffect, useMemo, useState } from "react"
import { baseCategoryImages } from "@/app/data/shopCategories"

export type ShopCategory = {
  _id?: string
  name: string
}

/**
 * Fetch dynamic categories from the admin API and merge with static categories.
 * Polls periodically to keep the Shop UI in sync with Admin changes.
 */
export function useCategories(options?: { pollMs?: number }) {
  const pollMs = options?.pollMs ?? 15000
  const [dynamicCategories, setDynamicCategories] = useState<ShopCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setDynamicCategories(Array.isArray(data) ? data : (data.items || []))
      } catch {
        // ignore network errors, keep existing state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const timer = setInterval(load, pollMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [pollMs])

  const categories = useMemo(() => {
    const staticNames = Object.keys(baseCategoryImages)
    const merged = new Set<string>([...staticNames, ...dynamicCategories.map(c => c.name)])
    return Array.from(merged)
  }, [dynamicCategories])

  return { categories, dynamicCategories, loading }
}


