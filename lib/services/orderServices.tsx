import { getDatabase } from "../mongodb"
import type { Order } from "../models/User"
import { ObjectId } from "mongodb"

export class OrderService {
  private static async getOrdersCollection() {
    const db = await getDatabase()
    return db.collection<Order>("orders")
  }

  static async createOrder(orderData: Omit<Order, "_id" | "createdAt" | "updatedAt">): Promise<Order> {
    const collection = await this.getOrdersCollection()

    const newOrder: Order = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newOrder)
    return { ...newOrder, _id: result.insertedId }
  }

  static async attachInvoice(orderId: string, invoice: NonNullable<Order["invoice"]>) {
    const collection = await this.getOrdersCollection()
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { invoice, updatedAt: new Date(), paymentStatus: "completed" } }
    )
    return result.modifiedCount > 0
  }

  static async getOrdersByUserId(userId: string): Promise<Order[]> {
    const collection = await this.getOrdersCollection()
    return await collection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    const collection = await this.getOrdersCollection()
    return await collection.findOne({ _id: new ObjectId(orderId) })
  }

  // Update order fields like orderStatus, paymentStatus, invoice, etc.
  static async updateOrderStatus(
    orderId: string,
    updateData: Partial<Pick<Order, "orderStatus" | "paymentStatus" | "invoice">> & Record<string, unknown>
  ): Promise<boolean> {
    const collection = await this.getOrdersCollection()

    const setFields: Record<string, unknown> = { updatedAt: new Date() }
    for (const [key, value] of Object.entries(updateData || {})) {
      if (value !== undefined) setFields[key] = value
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: setFields }
    )
    return result.modifiedCount > 0
  }
}
