"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/models/User"

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isLoggingOut: boolean
  login: (email: string, userName: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<{ success: boolean; otp?: string; verificationLink?: string; error?: string }>
  logout: () => Promise<void>
  syncUserData: () => Promise<void>
}

type RegisterData = {
  email: string
  userName: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, userName: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, userName }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem("user", JSON.stringify(data.user))

        // Sync local storage data with database
        await syncUserData()

        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (
    userData: RegisterData
  ): Promise<{ success: boolean; otp?: string; verificationLink?: string; error?: string }> => {
    try {
      // Get local storage data to sync with new account
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]")
      const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userData,
          cart: localCart,
          wishlist: localWishlist,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        return {
          success: true,
          otp: data?.otp,
          verificationLink: data?.verificationLink,
        }
      }
      return { success: false, error: data?.error }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "Registration failed. Please try again." }
    }
  }

  const logout = async () => {
    setIsLoggingOut(true)
    
    try {
      if (user?.email) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        })
      }

      // Clear user data
      setUser(null)
      localStorage.removeItem("user")
      localStorage.removeItem("cart")
      localStorage.removeItem("wishlist")
      
      // Wait a moment to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect to login page
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const syncUserData = async () => {
    if (!user) return

    try {
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]")
      const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")

      await fetch("/api/user/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          cart: localCart,
          wishlist: localWishlist,
        }),
      })
    } catch (error) {
      console.error("Sync error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggingOut,
        login,
        register,
        logout,
        syncUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
