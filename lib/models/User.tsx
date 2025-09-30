import type { ObjectId } from "mongodb"

export interface CartItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  size: string
  color: string
}

export interface WishlistItem {
  id: string
  name: string
  image: string
  price: number
}

export interface User {
  _id?: ObjectId
  email: string
  userName: string
  phone?: string
  address?: {
    address?: string,
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  cart: CartItem[]
  wishlist: WishlistItem[]
  orders: ObjectId[]
  createdAt: Date
  updatedAt: Date
  isEmailVerified: boolean
  preferences?: {
    newsletter: boolean
    notifications: boolean
  }
}

export interface Order {
  _id?: ObjectId
  userId: ObjectId
  items: CartItem[]
  shippingAddress: {
    userName: string
    email: string
    phone: string
    city: string
    state: string
    address: string
  }
  paymentMethod: string
  paymentStatus: "pending" | "completed" | "failed"
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled"
  subtotal: number
  tax: number
  shipping: number
  total: number
  createdAt: Date
  updatedAt: Date
}
export interface profileData {
  fullName: string
  userName: string
  email: string
  phone: string
  address: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}
