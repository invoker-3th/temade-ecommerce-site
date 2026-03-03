import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { getPermissionsForUser, hasPermission, requirePermissionFromRequest } from "@/lib/server/permissionGuard"
import { sendEmail } from "@/lib/email"
import { writeAuditLog } from "@/lib/audit"

type TeamNotification = {
  _id?: ObjectId
  type: "team_message"
  title: string
  message: string
  senderEmail: string
  recipientEmail: string
  read: boolean
  createdAt: Date
}

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "team:message")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const body = await request.json()
    const recipientId = String(body?.recipientUserId || "").trim()
    const recipientEmail = String(body?.recipientEmail || "").trim().toLowerCase()
    const subject = String(body?.subject || "").trim()
    const message = String(body?.message || "").trim()
    const deliverEmail = body?.deliverEmail !== false
    const deliverNotification = body?.deliverNotification !== false

    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 })
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 })
    if (!recipientId && !recipientEmail) {
      return NextResponse.json({ error: "recipientUserId or recipientEmail is required" }, { status: 400 })
    }
    if (!deliverEmail && !deliverNotification) {
      return NextResponse.json({ error: "Select at least one delivery channel (email or in-app)." }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCol = db.collection("users")
    const recipient = recipientId && ObjectId.isValid(recipientId)
      ? await usersCol.findOne({ _id: new ObjectId(recipientId) })
      : await usersCol.findOne({ email: { $regex: `^${recipientEmail}$`, $options: "i" } })

    if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    const to = String(recipient.email || "").trim().toLowerCase()
    if (!to) return NextResponse.json({ error: "Recipient email missing" }, { status: 400 })
    if (!recipient.isEmailVerified) {
      return NextResponse.json({ error: "Recipient must have a verified email account." }, { status: 400 })
    }

    const permissionState = await getPermissionsForUser(String(perm.adminEmail || ""))
    const canSendDirectEmail = hasPermission(permissionState.permissions, "email:send")

    if (deliverEmail && !canSendDirectEmail) {
      return NextResponse.json(
        { error: "You can send in-app messages only. Direct team email requires email:send permission." },
        { status: 403 }
      )
    }

    if (deliverEmail) {
      const html = `
        <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
          <h3 style="margin:0 0 8px;">${subject}</h3>
          <p>${message.replace(/\n/g, "<br/>")}</p>
          <hr style="margin:16px 0;border:none;border-top:1px solid #eee;" />
          <p style="font-size:12px;color:#666;">From Temade Admin: ${perm.adminEmail}</p>
          <p style="font-size:12px;color:#666;">Sent: ${new Date().toLocaleString()}</p>
        </div>
      `
      const text = `${message}\n\nFrom Temade Admin: ${perm.adminEmail}\nSent: ${new Date().toLocaleString()}`
      try {
        console.info("[admin.team.messages] Sending team message email", {
          from: perm.adminEmail,
          to,
          subject,
        })
        await sendEmail({ to, subject, html, text })
        console.info("[admin.team.messages] Team message email sent", {
          to,
          subject,
        })
      } catch (emailError) {
        console.error("[admin.team.messages] Team message email failed", {
          from: perm.adminEmail,
          to,
          subject,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        })
        return NextResponse.json({ error: "Failed to send team email" }, { status: 502 })
      }
    }

    if (deliverNotification) {
      const notification: TeamNotification = {
        type: "team_message",
        title: subject,
        message,
        senderEmail: perm.adminEmail,
        recipientEmail: to,
        read: false,
        createdAt: new Date(),
      }
      await db.collection<TeamNotification>("notifications").insertOne(notification)
    }

    await writeAuditLog({
      actorEmail: perm.adminEmail,
      action: "team.message.sent",
      targetEmail: to,
      targetId: recipient._id ? String(recipient._id) : undefined,
      metadata: {
        subject,
        deliverEmail,
        deliverNotification,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Team message POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
