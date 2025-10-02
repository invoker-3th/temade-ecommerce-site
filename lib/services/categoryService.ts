import { getDatabase } from "../mongodb"
import type { Category } from "../models/Category"
import { ObjectId } from "mongodb"

export class CategoryService {
  private static async col() {
    const db = await getDatabase()
    return db.collection<Category>("categories")
  }

  static async list(): Promise<Category[]> {
    const c = await this.col()
    return c.find({}).sort({ name: 1 }).toArray()
  }

  static async create(data: Omit<Category, "_id" | "createdAt" | "updatedAt">): Promise<Category> {
    const c = await this.col()
    const doc: Category = { ...data, createdAt: new Date(), updatedAt: new Date() }
    const res = await c.insertOne(doc)
    return { ...doc, _id: res.insertedId }
  }

  static async update(id: string, updates: Partial<Category>): Promise<boolean> {
    const c = await this.col()
    const res = await c.updateOne({ _id: new ObjectId(id) }, { $set: { ...updates, updatedAt: new Date() } })
    return res.modifiedCount > 0
  }

  static async remove(id: string): Promise<boolean> {
    const c = await this.col()
    const res = await c.deleteOne({ _id: new ObjectId(id) })
    return res.deletedCount > 0
  }
}



