import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { OrderService } from "@/lib/services/orderServices"

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

      // Update order status to paid and processing
      const success = await OrderService.updateOrderStatus(orderId, {
        paymentStatus: "completed",
        orderStatus: "processing",
        paymentReference: reference,
        paymentAmount: amount,
        paymentDate: new Date()
      })

      if (!success) {
        console.error(`Failed to update order ${orderId}`)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
      }

      console.log(`Order ${orderId} payment confirmed via webhook`)
      
      // Create admin notification
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_confirmed',
            title: 'Payment Confirmed',
            message: `Order ${orderId} payment of ₦${(amount / 100).toLocaleString()} confirmed via Paystack`,
            orderId,
            paymentReference: reference,
            amount: amount / 100
          })
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