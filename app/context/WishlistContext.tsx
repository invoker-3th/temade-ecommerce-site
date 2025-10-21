"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "./AuthContext"

type WishlistItem = {
  id: string
  name: string
  image: string
  price: number
  
}

type WishlistContextType = {
  wishlist: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: string) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const { user } = useAuth()

  // Load wishlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wishlist")
    if (saved) {
      setWishlist(JSON.parse(saved))
    }
  }, [])

  const syncWishlistWithDatabase = useCallback(async () => {
    if (!user?._id) return

    try {
      await fetch("/api/user/wishlist", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          wishlist: wishlist,
        }),
      })
    } catch (error) {
      console.error("Failed to sync wishlist with database:", error)
    }
  }, [user, wishlist])

  // Save wishlist to localStorage and sync with database
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist))

    // Sync with database if user is logged in
    if (user && user._id) {
      syncWishlistWithDatabase()
    }
  }, [wishlist, user, syncWishlistWithDatabase])

  const addToWishlist = (item: WishlistItem) => {
    setWishlist((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev // Prevent duplicates
      return [...prev, item]
    })
  }

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
