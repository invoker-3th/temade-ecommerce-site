import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { OrderService } from "@/lib/services/orderServices"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Paystack webhook secret from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature || !PAYSTACK_SECRET_KEY) {
      console.error("Missing Paystack signature or secret key")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the webhook signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex")

    if (hash !== signature) {
      console.error("Invalid Paystack signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log("Paystack webhook received:", event.event)

    // Handle successful payment
    if (event.event === "charge.success") {
      const { reference, amount, metadata } = event.data

      // Find the pending order by reference
      const orderId = metadata?.orderId || reference
      
      if (!orderId) {
        console.error("No order ID found in webhook data")
        return NextResponse.json({ error: "No order ID" }, { status: 400 })
      }

      // Verify the amount matches
      const expectedAmount = metadata?.amount
      if (expectedAmount && amount !== expectedAmount) {
        console.error(`Amount mismatch: expected ${expectedAmount}, got ${amount}`)
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
      }

      // Validate orderId is a proper ObjectId
      if (!ObjectId.isValid(orderId)) {
        console.error(`Invalid orderId in webhook: ${orderId}`)
        return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
      }

      // Get the order first to build the invoice
      const order = await OrderService.getOrderById(orderId)
      if (!order) {
        console.error(`Order ${orderId} not found`)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}`
      const invoice = {
        number: invoiceNumber,
        issuedAt: new Date(),
        items: order.items.map(item => ({
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

      // Update order status to paid and processing with invoice
      const success = await OrderService.updateOrderStatus(orderId, {
        paymentStatus: "completed",
        orderStatus: "processing",
        paymentReference: reference,
        paymentAmount: amount,
        paymentDate: new Date(),
        invoice
      })

      if (!success) {
        console.error(`Failed to update order ${orderId}`)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
      }

      console.log(`Order ${orderId} payment confirmed via webhook`)
      
      // Create admin notification directly (avoid external fetch/base URL issues)
      try {
        const db = await getDatabase()
        await db.collection('notifications').insertOne({
          type: 'payment_confirmed',
          title: 'Payment Confirmed',
          message: `Order ${orderId} payment of ${order.currency === 'USD' ? '$' : order.currency === 'GBP' ? '£' : '₦'}${(amount / 100).toLocaleString()} confirmed via Paystack`,
          orderId,
          paymentReference: reference,
          amount: amount / 100,
          read: false,
          createdAt: new Date()
        })
      } catch (error) {
        console.error('Failed to create admin notification:', error)
      }
      
      // TODO: Send customer confirmation email here
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Paystack webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}