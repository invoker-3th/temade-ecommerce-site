import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Order, User } from "@/lib/models/User"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const orderId = searchParams.get("orderId")
    const db = await getDatabase()
    const ordersCol = db.collection<Order>("orders")
    const usersCol = db.collection<User>("users")

    const query: Partial<Record<string, unknown>> = {}
    if (orderId && ObjectId.isValid(orderId)) {
      query._id = new ObjectId(orderId)
    }
    if (userId) {
      query.userId = new ObjectId(userId)
    }

    const orders = await ordersCol
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Join minimal user info
    const userIds = Array.from(
      new Set(
        orders
          .map((o) => o.userId)
          .filter((id): id is ObjectId => Boolean(id))
          .map((id) => id as ObjectId)
      )
    )

    const users = userIds.length
      ? await usersCol
          .find({ _id: { $in: userIds } }, { projection: { _id: 1, email: 1, userName: 1, phone: 1, address: 1 } })
          .toArray()
      : []
    const idToUser = new Map<string, Pick<User, "_id" | "email" | "userName" | "phone" | "address">>(
      users.map((u) => [String(u._id), u])
    )

    const withUser = orders.map((o) => ({
      ...o,
      user: idToUser.get(String(o.userId)) || null,
    }))

    const count = await ordersCol.countDocuments(query)

    return NextResponse.json({ orders: withUser, count })
  } catch (error) {
    console.error("Admin orders GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { orderId, status } = body as {
      orderId?: string
      status?: string
    }
    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status required" }, { status: 400 })
    }
    const allowedOrder = ["pending", "processing", "shipped", "delivered", "cancelled", "completed"]
    if (status && !allowedOrder.includes(status)) return NextResponse.json({ error: "invalid order status" }, { status: 400 })

    const db = await getDatabase()
    const setFields: Record<string, unknown> = { updatedAt: new Date() }
    if (status) setFields.orderStatus = status
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { $set: setFields }
    )

    if (!result.modifiedCount) return NextResponse.json({ error: "not modified" }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Admin orders PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


