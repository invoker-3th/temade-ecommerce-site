import { NextRequest, NextResponse } from "next/server"
import { OrderService } from "@/lib/services/orderServices"
import { getDatabase } from "@/lib/mongodb"
import { verifyPaystackTransaction } from "@/lib/paystack"
import { capturePosthogServerEvent } from "@/lib/posthog-server"

export async function POST(request: NextRequest) {
  try {
    const { reference, orderId } = (await request.json()) as {
      reference?: string
      orderId?: string
    }

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 })
    }

    const verifyResult = await verifyPaystackTransaction(reference)
    const verifyRes = verifyResult.res
    const verifyData = verifyResult.data
    if (!verifyRes.ok || !verifyData?.status) {
      return NextResponse.json({ error: "Failed to verify transaction", details: verifyData }, { status: 400 })
    }

    const tx = verifyData?.data
    if (!tx || tx.status !== "success") {
      return NextResponse.json({ error: "Transaction is not successful yet", details: tx }, { status: 400 })
    }

    const resolvedOrderId =
      String(orderId || "").trim() ||
      String(tx?.metadata?.orderId || "").trim() ||
      String(reference).trim()

    if (!resolvedOrderId) {
      return NextResponse.json({ error: "Could not resolve order ID" }, { status: 400 })
    }

    const order = await OrderService.getOrderById(resolvedOrderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Always persist transaction reference/details so pending orders can be retried.
    await OrderService.updateOrderStatus(resolvedOrderId, {
      paymentReference: reference,
      paymentGatewayResponse: String(tx?.gateway_response || ""),
      paymentChannel: String(tx?.channel || ""),
      paymentLastCheckedAt: new Date(),
      paymentProviderStatus: String(tx?.status || ""),
      paymentDate: tx?.paid_at ? new Date(tx.paid_at) : undefined,
    })

    if (order.paymentStatus === "completed") {
      return NextResponse.json({ ok: true, alreadyCompleted: true, orderId: resolvedOrderId })
    }

    const invoiceNumber = `INV-${Date.now()}`
    const invoice = {
      number: invoiceNumber,
      issuedAt: new Date(),
      items: order.items.map((item) => ({
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
        name: order.shippingAddress.userName,
        email: order.shippingAddress.email,
        phone: order.shippingAddress.phone,
      },
      payment: { method: "paystack", reference },
    }

    const updated = await OrderService.updateOrderStatus(resolvedOrderId, {
      paymentStatus: "completed",
      orderStatus: "processing",
      paymentReference: reference,
      paymentAmount: tx.amount,
      paymentDate: new Date(tx.paid_at || Date.now()),
      invoice,
    })

    if (!updated) {
      return NextResponse.json({ error: "Failed to update order payment status" }, { status: 500 })
    }

    await capturePosthogServerEvent({
      event: "purchase_completed",
      distinctId:
        (order.userId ? String(order.userId) : "") ||
        order.shippingAddress.email ||
        reference,
      properties: {
        source: "paystack_verify_route",
        order_id: resolvedOrderId,
        transaction_reference: reference,
        currency: order.currency,
        value: order.total,
        amount_minor: Number(tx.amount || 0),
        item_count: order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        items: order.items.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_variant: item.size || "",
          item_category: item.color || "",
        })),
      },
    })

    try {
      const db = await getDatabase()
      await db.collection("notifications").insertOne({
        type: "payment_confirmed",
        title: "Payment Confirmed",
        message: `Order ${resolvedOrderId} payment confirmed.`,
        orderId: resolvedOrderId,
        paymentReference: reference,
        amount: Number(tx.amount || 0) / 100,
        read: false,
        createdAt: new Date(),
      })
    } catch (notificationError) {
      console.error("Paystack verify notification error:", notificationError)
    }

    return NextResponse.json({ ok: true, orderId: resolvedOrderId })
  } catch (error) {
    console.error("Paystack verify route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
