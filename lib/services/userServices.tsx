import { getDatabase } from "../mongodb"
import type { User, CartItem, WishlistItem } from "../models/User"
import { ObjectId } from "mongodb"

export class UserService {
  private static async getUsersCollection() {
    const db = await getDatabase()
    return db.collection<User>("users")
  }

  static async createUser(userData: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User> {
    const collection = await this.getUsersCollection()

    const newUser: User = {
      ...userData,
      email: userData.email.trim().toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newUser)
    return { ...newUser, _id: result.insertedId }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const collection = await this.getUsersCollection()
    const trimmed = email.trim()
    if (!trimmed) return null
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return await collection.findOne({ email: { $regex: `^${escaped}$`, $options: "i" } })
  }

  static async getUserById(userId: string): Promise<User | null> {
    const collection = await this.getUsersCollection()
    return await collection.findOne({ _id: new ObjectId(userId) })
  }

  static async updateUserCart(userId: string, cart: CartItem[]): Promise<boolean> {
    const collection = await this.getUsersCollection()
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          cart,
          updatedAt: new Date(),
        },
      },
    )
    return result.modifiedCount > 0
  }

  static async updateUserWishlist(userId: string, wishlist: WishlistItem[]): Promise<boolean> {
    const collection = await this.getUsersCollection()
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          wishlist,
          updatedAt: new Date(),
        },
      },
    )
    return result.modifiedCount > 0
  }

  static async syncUserData(userId: string, cart: CartItem[], wishlist: WishlistItem[]): Promise<boolean> {
    const collection = await this.getUsersCollection()
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          cart,
          wishlist,
          updatedAt: new Date(),
        },
      },
    )
    return result.modifiedCount > 0
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    const collection = await this.getUsersCollection()
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )
    return result.modifiedCount > 0
  }
}
