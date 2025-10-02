import { type NextRequest, NextResponse } from "next/server"
import { OrderService } from "@/lib/services/orderServices"
import { UserService } from "@/lib/services/userServices"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, items, shippingAddress, paymentMethod, subtotal, tax, shipping, total } = body

    if (!userId || !items || !shippingAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create order
    const orderData = {
      userId: new ObjectId(userId),
      // Normalize line items for analytics pipeline
      items: (items || []).map((it: { id: string | number; name: string; image?: string; price: number; quantity: number }) => ({
        id: String(it.id),
        name: String(it.name),
        image: String(it.image || ""),
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
      })),
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending" as const,
      orderStatus: "processing" as const,
      subtotal,
      tax,
      shipping,
      total,
    }

    const newOrder = await OrderService.createOrder(orderData)

    // Clear user's cart after successful order
    await UserService.updateUserCart(userId, [])

    return NextResponse.json(
      {
        message: "Order created successfully",
        order: newOrder,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const orders = await OrderService.getOrdersByUserId(userId)

    return NextResponse.json(
      {
        orders,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
