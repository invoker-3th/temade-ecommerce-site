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

  static async updateOrderStatus(orderId: string, status: Order["orderStatus"]): Promise<boolean> {
    const collection = await this.getOrdersCollection()
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          orderStatus: status,
          updatedAt: new Date(),
        },
      },
    )
    return result.modifiedCount > 0
  }
}
