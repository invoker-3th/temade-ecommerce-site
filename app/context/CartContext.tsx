"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./AuthContext"
import { pickPrice } from "./CurrencyContext"
import type { SupportedCurrency } from "./CurrencyContext"

type CartItem = {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  size: string
  color: string
  // Store original product data for currency conversion
  priceNGN?: number
  priceUSD?: number
  priceGBP?: number
}

type CartContextType = {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeItem: (id: string) => void
  increaseQty: (id: string) => void
  decreaseQty: (id: string) => void
  getTotal: () => number
  clearCart: () => void
  updateCartCurrency: (currency: SupportedCurrency) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart")
    if (stored) {
      setCartItems(JSON.parse(stored))
    }
  }, [])

  const syncCartWithDatabase = useCallback(async () => {
    if (!user?._id) return

    try {
      await fetch("/api/user/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          cart: cartItems,
        }),
      })
    } catch (error) {
      console.error("Failed to sync cart with database:", error)
    }
  }, [user, cartItems])

  // Save to localStorage and sync with database
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems))

    if (user && user._id) {
      syncCartWithDatabase()
    }
  }, [cartItems, user, syncCartWithDatabase])

  // Clear cart on logout
  useEffect(() => {
    if (!user) {
      setCartItems([])
    }
  }, [user])

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.size === item.size)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size ? { ...i, quantity: i.quantity + item.quantity } : i,
        )
      } else {
        return [...prev, item]
      }
    })
  }

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const increaseQty = (id: string) => {
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)))
  }

  const decreaseQty = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item)),
    )
  }

  const getTotal = () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

  const clearCart = () => {
    setCartItems([]) // ✅ empty cart state
    localStorage.removeItem("cart") // ✅ clear localStorage
  }

  const updateCartCurrency = useCallback((currency: SupportedCurrency) => {
    setCartItems((prev) => 
      prev.map((item) => ({
        ...item,
        price: pickPrice(item, currency) ?? item.price
      }))
    )
  }, [])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        increaseQty,
        decreaseQty,
        getTotal,
        clearCart,
        updateCartCurrency,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
