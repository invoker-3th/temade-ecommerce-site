import { type NextRequest, NextResponse } from "next/server"
import { OrderService } from "@/lib/services/orderServices"
import { UserService } from "@/lib/services/userServices"
import { ObjectId } from "mongodb"
// removed unused Order type import

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
  const { userId, items, shippingAddress, paymentMethod, subtotal, tax, total, currency } = body

    if (!items || !shippingAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create order
    const orderData = {
      ...(userId ? { userId: new ObjectId(userId) } : {}),
      // Normalize line items for analytics pipeline
      items: (items || []).map((it: { id: string | number; name: string; image?: string; price: number; quantity: number; size?: string; color?: string }) => ({
        id: String(it.id),
        name: String(it.name),
        image: String(it.image || ""),
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        size: it.size || "One Size",
        color: it.color || "Default",
      })),
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending" as const,
      orderStatus: "processing" as const,
      currency: currency || "NGN",
      subtotal,
      tax,
      total,
    }

    const newOrder = await OrderService.createOrder(orderData)

    // Clear user's cart after successful order (only for logged-in users)
    if (userId) {
      await UserService.updateUserCart(userId, [])
    }

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

// Webhook to handle Paystack (or other PSP) payment success and attach invoice
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, reference, paymentMethod, paymentStatus, orderStatus, shippingAddress, items, subtotal, tax, total, customer, currency } = body

    if (!orderId || !reference) {
      return NextResponse.json({ error: "orderId and reference are required" }, { status: 400 })
    }

    const invoiceNumber = `INV-${Date.now()}`
    const invoice = {
      number: invoiceNumber,
      issuedAt: new Date(),
      items: (items || []).map((it: { name: string; color?: string; size?: string; price: number; quantity: number }) => ({
        name: it.name,
        color: it.color,
        size: it.size,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        total: Number(it.price || 0) * Number(it.quantity || 1),
      })),
      subtotal: Number(subtotal || 0),
      tax: Number(tax || 0),
      total: Number(total || 0),
      currency: currency || "NGN",
      shippingAddress,
      customer: {
        name: customer?.name || shippingAddress?.userName,
        email: customer?.email || shippingAddress?.email,
        phone: customer?.phone || shippingAddress?.phone,
      },
      payment: { method: paymentMethod || "paystack", reference },
    }

    // Update order with payment status and attach invoice
    const ok = await OrderService.updateOrderStatus(orderId, {
      paymentStatus: paymentStatus || "completed",
      orderStatus: orderStatus || "processing",
      invoice
    })
    
    if (!ok) return NextResponse.json({ error: "Failed to update order" }, { status: 400 })

    return NextResponse.json({ ok: true, invoice })
  } catch (error) {
    console.error("Order update error:", error)
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
