import { ObjectId } from "mongodb"
import { getDatabase } from "../mongodb"
import { Profile } from "../models/profile"

export class ProfileService {
  // Create or update (used for POST /api/profile)
  static async createOrUpdateProfile(
    userId: string,
    data: Omit<Profile, "_id" | "userId" | "createdAt" | "updatedAt">
  ) {
    const db = await getDatabase()
    const profiles = db.collection<Profile>("profiles")

    const now = new Date()
    const filter = { userId: new ObjectId(userId) }
    const update = {
      $set: {
        ...data,
        updatedAt: now,
      },
      $setOnInsert: {
        userId: new ObjectId(userId),
        createdAt: now,
      },
    }

    const result = await profiles.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: "after",
    })

    return result
  }

  // Fetch profile (used for GET /api/profile)
  static async getProfile(userId: string) {
    const db = await getDatabase()
    const profiles = db.collection<Profile>("profiles")
    return profiles.findOne({ userId: new ObjectId(userId) })
  }

  // Update profile partially (used for PATCH /api/profile)
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, "_id" | "userId" | "createdAt">>
  ) {
    const db = await getDatabase()
    const profiles = db.collection<Profile>("profiles")

    const result = await profiles.findOneAndUpdate(
      { userId: new ObjectId(userId) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    )

    return result
  }
}
