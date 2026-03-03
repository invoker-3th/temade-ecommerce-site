import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { sendEmail } from "@/lib/email"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "orders:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const db = await getDatabase()
    const now = new Date()
    const orders = await db
      .collection("orders")
      .find({
        orderStatus: "shipped",
        "shipment.etaAt": { $lte: now },
        "shipment.reminderSentAt": null,
      })
      .limit(100)
      .toArray()

    let sent = 0
    for (const order of orders) {
      const customerEmail = String(order.shippingAddress?.email || "")
      if (!customerEmail) continue

      try {
        console.info("[admin.orders.reminders] Sending delivery reminder email", {
          orderId: String(order._id),
          to: customerEmail.toLowerCase(),
        })
        await sendEmail({
          to: customerEmail,
          subject: `Delivery check-in for order ${String(order._id)}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #222;">
              <h2>Your order should have arrived</h2>
              <p>Order ID: <strong>${String(order._id)}</strong></p>
              <p>If you are facing challenges or have complaints, reach out to <strong>Orders@temadestudios.com</strong>.</p>
            </div>
          `,
          text: `Your order ${String(order._id)} should have arrived. If you have any challenges, contact Orders@temadestudios.com.`,
        })
        console.info("[admin.orders.reminders] Delivery reminder email sent", {
          orderId: String(order._id),
          to: customerEmail.toLowerCase(),
        })

        await db.collection("orders").updateOne(
          { _id: order._id },
          { $set: { "shipment.reminderSentAt": new Date(), updatedAt: new Date() } }
        )
        sent += 1
      } catch (err) {
        console.error("Failed sending delivery reminder:", order._id, err)
      }
    }

    return NextResponse.json({ ok: true, sent, checked: orders.length })
  } catch (error) {
    console.error("process-reminders route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
