"use client"

import { useEffect, useState } from "react"
import { useCurrency, type SupportedCurrency } from "../context/CurrencyContext"

export default function RegionDialog() {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [hasChoice, setHasChoice] = useState(false)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("currency") : null
    if (!stored) {
      setOpen(true)
      setHasChoice(false)
    } else {
      setHasChoice(true)
    }
  }, [])

  const choose = (region: "NGN" | "GBP" | "USD") => {
    setCurrency(region as SupportedCurrency)
    setHasChoice(true)
    setOpen(false)
  }

  if (!open || hasChoice) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-[90%] max-w-md rounded-xl bg-[#FFFBEB] border border-[#E4D9C6] shadow-xl p-6">
        <h2 className="text-xl font-semibold text-[#2C2C2C] mb-2">Where are you shopping from?</h2>
        <p className="text-sm text-[#6B6B6B] mb-5">Your selection sets the currency across the site.</p>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => choose("NGN")}
            className={`w-full rounded-md border px-4 py-3 text-left transition hover:border-[#8D2741] ${
              currency === "NGN" ? "bg-[#8D2741] text-white border-[#8D2741]" : "bg-white border-[#E5E7EB] text-[#1F2937]"
            }`}
          >
            Nigeria (₦)
          </button>
          <button
            onClick={() => choose("GBP")}
            className={`w-full rounded-md border px-4 py-3 text-left transition hover:border-[#8D2741] ${
              currency === "GBP" ? "bg-[#8D2741] text-white border-[#8D2741]" : "bg-white border-[#E5E7EB] text-[#1F2937]"
            }`}
          >
            United Kingdom (£)
          </button>
          <button
            onClick={() => choose("USD")}
            className={`w-full rounded-md border px-4 py-3 text-left transition hover:border-[#8D2741] ${
              currency === "USD" ? "bg-[#8D2741] text-white border-[#8D2741]" : "bg-white border-[#E5E7EB] text-[#1F2937]"
            }`}
          >
            USA & Others ($)
          </button>
        </div>
      </div>
    </div>
  )
}


