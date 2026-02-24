"use client"

import { useEffect, useState } from "react"

const DEFAULT_MESSAGE = "Shop New Arrivals on TemAde today!"

const TopBar = () => {
  const [message, setMessage] = useState(DEFAULT_MESSAGE)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const res = await fetch("/api/site-content/top-bar", { cache: "no-store" })
        const data = await res.json()
        if (!mounted) return
        const nextMessage = String(data?.message || "").trim()
        setMessage(nextMessage || DEFAULT_MESSAGE)
      } catch {
        if (!mounted) return
        setMessage(DEFAULT_MESSAGE)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="w-full h-9 bg-[#8D2741] text-white text-sm flex items-center justify-center relative z-40">
      {message}
    </div>
  )
}

export default TopBar
