import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { sendEmail } from "@/lib/email"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "orders:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const body = await request.json()
    const orderId = String(body.orderId || "").trim()
    const etaDays = Number(body.etaDays || 0)

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Valid orderId is required" }, { status: 400 })
    }
    if (!Number.isFinite(etaDays) || etaDays < 1 || etaDays > 60) {
      return NextResponse.json({ error: "etaDays must be between 1 and 60" }, { status: 400 })
    }

    const db = await getDatabase()
    const ordersCol = db.collection("orders")
    const order = await ordersCol.findOne({ _id: new ObjectId(orderId) })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const shippedAt = new Date()
    const etaAt = new Date(shippedAt.getTime() + etaDays * 24 * 60 * 60 * 1000)

    await ordersCol.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          orderStatus: "shipped",
          updatedAt: new Date(),
          shipment: {
            shippedAt,
            etaDays,
            etaAt,
            shippedEmailSentAt: new Date(),
            reminderSentAt: null,
          },
        },
      }
    )

    const customerEmail = String(order.shippingAddress?.email || "")
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `Your order ${String(order._id)} has been shipped`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #222;">
            <h2>Your order has been shipped</h2>
            <p>Order ID: <strong>${String(order._id)}</strong></p>
            <p>Estimated delivery: <strong>${etaDays} day(s)</strong></p>
            <p>If you need support, please contact Orders@temadestudios.com.</p>
          </div>
        `,
        text: `Your order ${String(order._id)} has been shipped. Estimated delivery: ${etaDays} day(s). Contact Orders@temadestudios.com for support.`,
      })
    }

    await db.collection("notifications").insertOne({
      type: "order_updated",
      title: "Order marked as shipped",
      message: `Order ${String(order._id)} marked shipped. ETA: ${etaDays} day(s).`,
      orderId: String(order._id),
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true, etaAt })
  } catch (error) {
    console.error("Ship order route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
