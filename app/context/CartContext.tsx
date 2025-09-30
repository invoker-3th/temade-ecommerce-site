"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./AuthContext"

type CartItem = {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  size: string
  color: string
}

type CartContextType = {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeItem: (id: string) => void
  increaseQty: (id: string) => void
  decreaseQty: (id: string) => void
  getTotal: () => number
  clearCart: () => void   // ✅ added
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

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        increaseQty,
        decreaseQty,
        getTotal,
        clearCart, // ✅ exposed
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
