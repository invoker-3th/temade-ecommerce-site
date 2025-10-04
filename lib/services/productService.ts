import { getDatabase } from "../mongodb"
import type { Product } from "../models/Product"
import { ObjectId } from "mongodb"

export class ProductService {
  private static async col() {
    const db = await getDatabase()
    return db.collection<Product>("products")
  }

  static async list(): Promise<Product[]> {
    const c = await this.col()
    return c.find({}).sort({ updatedAt: -1 }).toArray()
  }

  static async listByCategory(category: string): Promise<Product[]> {
    const c = await this.col()
    return c.find({ category: category }).toArray()
  }

  static async create(data: Omit<Product, "_id" | "createdAt" | "updatedAt">): Promise<Product> {
    const c = await this.col()
    const doc: Product = { ...data, createdAt: new Date(), updatedAt: new Date() }
    const res = await c.insertOne(doc)
    return { ...doc, _id: res.insertedId }
  }

  static async update(id: string, updates: Partial<Product>): Promise<boolean> {
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



