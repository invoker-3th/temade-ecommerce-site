import { ObjectId } from "mongodb"
import { getDatabase } from "../mongodb"
import { Profile } from "../models/profile"

export class ProfileService {
  static async createOrUpdateProfile(
    userId: string,
    data: Omit<Profile, "_id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Profile | null> {
    const db = await getDatabase()
    const profiles = db.collection<Profile>("profiles")

    const now = new Date()

    await profiles.updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: { ...data, updatedAt: now },
        $setOnInsert: { userId: new ObjectId(userId), createdAt: now },
      },
      { upsert: true }
    )

    return profiles.findOne({ userId: new ObjectId(userId) })
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    const db = await getDatabase()
    const profiles = db.collection<Profile>("profiles")
    return profiles.findOne({ userId: new ObjectId(userId) })
  }

  static async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, "_id" | "userId" | "createdAt">>
  ): Promise<Profile | null> {
    const db = await getDatabase()
    const profiles = db.collection<Profile>("profiles")

    const now = new Date()

    // Allowlist of editable fields to avoid conflicts and protected fields
    const allowedKeys: Array<keyof Omit<Profile, "_id" | "userId" | "createdAt" | "updatedAt">> = [
      "fullName",
      "userName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
    ]

    const safe: Partial<Profile> = {}
    for (const key of allowedKeys) {
      const value = (updates as Partial<Record<string, unknown>>)[key as string]
      if (value !== undefined) {
        ;(safe as Record<string, unknown>)[key as string] = value
      }
    }

    await profiles.updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: { ...safe, updatedAt: now },
        $setOnInsert: { userId: new ObjectId(userId), createdAt: now },
      },
      { upsert: true }
    )

    return profiles.findOne({ userId: new ObjectId(userId) })
  }
}
