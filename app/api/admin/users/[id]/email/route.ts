import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"
import { sendEmail } from "@/lib/email"
import { writeAuditLog } from "@/lib/audit"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermissionFromRequest(request, "email:send")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const { id } = await params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid user id required" }, { status: 400 })
    }

    const body = await request.json()
    const subject = String(body?.subject || "").trim()
    const message = String(body?.message || "").trim()

    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 })
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 })
    if (subject.length > 140) return NextResponse.json({ error: "subject too long" }, { status: 400 })

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const to = String(user.email || "").trim()
    if (!to) return NextResponse.json({ error: "User email missing" }, { status: 400 })

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
        <p>${message.replace(/\n/g, "<br/>")}</p>
        <hr style="margin:16px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#666;">Sent by Temade Admin: ${perm.adminEmail}</p>
      </div>
    `
    const text = `${message}\n\n— Sent by Temade Admin: ${perm.adminEmail}`

    await sendEmail({ to, subject, html, text })

    await writeAuditLog({
      actorEmail: perm.adminEmail,
      action: "user.email.sent",
      targetEmail: to,
      targetId: id,
      metadata: { subject },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user email POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


