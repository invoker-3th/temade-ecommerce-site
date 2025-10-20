"use client"

import { useEffect, useRef } from "react"
import { useCurrency } from "../context/CurrencyContext"
import { useCart } from "../context/CartContext"

export default function CartCurrencyUpdater() {
  const { currency } = useCurrency()
  const { updateCartCurrency } = useCart()
  const lastCurrency = useRef(currency)

  useEffect(() => {
    // Only update if currency actually changed
    if (lastCurrency.current !== currency) {
      lastCurrency.current = currency
      updateCartCurrency(currency)
    }
  }, [currency, updateCartCurrency])

  return null // This component doesn't render anything
}
