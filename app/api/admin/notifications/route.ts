import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

type Notification = {
  _id?: ObjectId
  type: "payment_confirmed" | "order_updated" | "new_order" | "new_user"
  title: string
  message: string
  orderId?: string
  userId?: string
  userEmail?: string
  paymentReference?: string
  amount?: number
  read: boolean
  createdAt: Date
}

export async function GET(request: Request) {
  const perm = await requirePermissionFromRequest(request, "orders:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const db = await getDatabase()
    const notifications = await db.collection<Notification>("notifications")
      .find({ read: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const perm = await requirePermissionFromRequest(request, "orders:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const body = await request.json()
    const { type, title, message, orderId, paymentReference, amount } = body

    const db = await getDatabase()
    const notification: Notification = {
      type,
      title,
      message,
      orderId,
      paymentReference,
      amount,
      read: false,
      createdAt: new Date()
    }

    await db.collection<Notification>("notifications").insertOne(notification)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification creation error:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const perm = await requirePermissionFromRequest(request, "orders:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const body = await request.json()
    const { notificationId } = body

    const db = await getDatabase()
    const result = await db.collection<Notification>("notifications")
      .updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true } }
      )

    return NextResponse.json({ success: result.modifiedCount > 0 })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
