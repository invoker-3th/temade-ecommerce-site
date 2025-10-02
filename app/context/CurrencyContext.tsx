"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type SupportedCurrency = "NGN" | "USD" | "GBP"

type CurrencyState = {
  currency: SupportedCurrency
  symbol: string
  setCurrency: (c: SupportedCurrency) => void
}

const CurrencyContext = createContext<CurrencyState | undefined>(undefined)

function getSymbol(code: SupportedCurrency): string {
  switch (code) {
    case "NGN":
      return "₦"
    case "GBP":
      return "£"
    case "USD":
    default:
      return "$"
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>("NGN")

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("currency") as SupportedCurrency | null) : null
    if (stored) {
      setCurrencyState(stored)
    }
  }, [])

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c)
    if (typeof window !== "undefined") {
      localStorage.setItem("currency", c)
    }
  }

  const value = useMemo<CurrencyState>(() => ({ currency, symbol: getSymbol(currency), setCurrency }), [currency])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyState {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}

export function pickPrice(
  item: { price?: number; priceNGN?: number; priceUSD?: number; priceGBP?: number },
  currency: SupportedCurrency,
): number | undefined {
  if (!item) return undefined
  if (currency === "NGN") return item.priceNGN ?? item.price
  if (currency === "USD") return item.priceUSD ?? item.price
  if (currency === "GBP") return item.priceGBP ?? item.price
  return item.price
}

 
