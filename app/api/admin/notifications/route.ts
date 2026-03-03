import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getPermissionsForUser, hasPermission, requireAnyPermissionFromRequest, requirePermissionFromRequest } from "@/lib/server/permissionGuard"

type Notification = {
  _id?: ObjectId
  type: "payment_confirmed" | "order_updated" | "new_order" | "new_user" | "team_message"
  title: string
  message: string
  orderId?: string
  userId?: string
  userEmail?: string
  senderEmail?: string
  recipientEmail?: string
  paymentReference?: string
  amount?: number
  read: boolean
  createdAt: Date
}

export async function GET(request: Request) {
  const perm = await requireAnyPermissionFromRequest(request, ["orders:view", "users:view", "email:send", "team:message"])
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const db = await getDatabase()
    const adminEmail = String(perm.adminEmail || "").trim().toLowerCase()
    const permissionState = await getPermissionsForUser(adminEmail)
    const canViewOrderNotifications = hasPermission(permissionState.permissions, "orders:view")
    const query: Record<string, unknown> = canViewOrderNotifications
      ? {
          read: false,
          $or: [
            { type: { $ne: "team_message" as const } },
            { type: "team_message", recipientEmail: adminEmail },
          ],
        }
      : {
          read: false,
          type: "team_message",
          recipientEmail: adminEmail,
        }
    const notifications = await db.collection<Notification>("notifications")
      .find(query)
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
  const perm = await requireAnyPermissionFromRequest(request, ["orders:view", "users:view", "email:send", "team:message"])
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const body = await request.json()
    const { notificationId } = body
    if (!notificationId || !ObjectId.isValid(notificationId)) {
      return NextResponse.json({ error: "Valid notificationId required" }, { status: 400 })
    }

    const db = await getDatabase()
    const target = await db.collection<Notification>("notifications").findOne({ _id: new ObjectId(notificationId) })
    if (!target) return NextResponse.json({ error: "Notification not found" }, { status: 404 })

    const adminEmail = String(perm.adminEmail || "").trim().toLowerCase()
    const permissionState = await getPermissionsForUser(adminEmail)
    const canViewOrderNotifications = hasPermission(permissionState.permissions, "orders:view")
    if (target.type === "team_message" && String(target.recipientEmail || "").trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Cannot modify another user's team message." }, { status: 403 })
    }
    if (target.type !== "team_message" && !canViewOrderNotifications) {
      return NextResponse.json({ error: "Insufficient permission for this notification type." }, { status: 403 })
    }

    const result = await db.collection<Notification>("notifications").updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true } }
    )

    return NextResponse.json({ success: result.modifiedCount > 0 })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
