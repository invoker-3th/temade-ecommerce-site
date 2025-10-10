import { getDatabase } from "../mongodb"
import type { LookbookSectionDoc } from "../models/Lookbook"

export class LookbookService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<LookbookSectionDoc>("lookbook")
  }

  static async list(): Promise<LookbookSectionDoc[]> {
    const col = await this.getCollection()
    return await col.find({}).sort({ createdAt: -1 }).toArray()
  }

  static async upsertSection(material: string, images: string[]): Promise<LookbookSectionDoc> {
    const col = await this.getCollection()
    const now = new Date()
    const res = await col.findOneAndUpdate(
      { material },
      { $set: { images, updatedAt: now }, $setOnInsert: { createdAt: now, material } },
      { upsert: true, returnDocument: "after" }
    )
    return res as unknown as LookbookSectionDoc
  }

  static async addImage(material: string, image: string): Promise<boolean> {
    const col = await this.getCollection()
    const res = await col.updateOne(
      { material },
      { $addToSet: { images: image }, $set: { updatedAt: new Date() } },
      { upsert: true }
    )
    return res.acknowledged === true
  }

  static async removeImage(material: string, image: string): Promise<boolean> {
    const col = await this.getCollection()
    const res = await col.updateOne(
      { material },
      { $pull: { images: image }, $set: { updatedAt: new Date() } }
    )
    return res.modifiedCount > 0
  }
}

