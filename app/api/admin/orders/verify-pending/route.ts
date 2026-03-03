import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { OrderService } from "@/lib/services/orderServices"
import { verifyPaystackTransaction } from "@/lib/paystack"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "orders:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const db = await getDatabase()
    const pendingOrders = await db
      .collection("orders")
      .find({
        paymentMethod: "paystack",
        paymentStatus: "pending",
        $or: [
          { paymentReference: { $exists: true, $ne: "" } },
          { "invoice.payment.reference": { $exists: true, $ne: "" } },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray()

    let verified = 0
    let checked = 0
    for (const order of pendingOrders) {
      checked += 1
      const reference = String(order.paymentReference || order?.invoice?.payment?.reference || "")
      if (!reference) continue

      try {
        const { res, data } = await verifyPaystackTransaction(reference)
        if (!res.ok || !data?.status) continue

        const tx = data.data
        await OrderService.updateOrderStatus(String(order._id), {
          paymentReference: reference,
          paymentGatewayResponse: String(tx?.gateway_response || ""),
          paymentChannel: String(tx?.channel || ""),
          paymentLastCheckedAt: new Date(),
          paymentProviderStatus: String(tx?.status || ""),
          paymentTransactionId: String(tx?.id || ""),
          paymentAmountMinor: Number(tx?.amount || 0),
          paymentAmountMajor: Number(tx?.amount || 0) / 100,
          paymentDate: tx?.paid_at ? new Date(tx.paid_at) : undefined,
        })

        if (tx?.status === "success") {
          const invoiceNumber = order.invoice?.number || `INV-${Date.now()}`
          const invoice = order.invoice || {
            number: invoiceNumber,
            issuedAt: new Date(),
            items: (order.items || []).map((item: { name: string; color?: string; size?: string; price: number; quantity: number }) => ({
              name: item.name,
              color: item.color || "",
              size: item.size || "",
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            currency: order.currency,
            shippingAddress: order.shippingAddress,
            customer: {
              name: order.shippingAddress?.userName,
              email: order.shippingAddress?.email,
              phone: order.shippingAddress?.phone,
            },
            payment: { method: "paystack", reference },
          }

          const ok = await OrderService.updateOrderStatus(String(order._id), {
            paymentStatus: "completed",
            orderStatus: "processing",
            invoice,
          })
          if (ok) verified += 1
        }
      } catch (error) {
        console.error("verify-pending order error:", order._id, error)
      }
    }

    return NextResponse.json({ ok: true, checked, verified })
  } catch (error) {
    console.error("verify-pending route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
