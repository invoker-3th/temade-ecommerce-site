type SendEmailParams = {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL
  const replyTo = process.env.RESEND_REPLY_TO

  if (!apiKey || !from) {
    throw new Error("Resend is not configured")
  }

  const payload: Record<string, unknown> = {
    from,
    to,
    subject,
    html,
  }

  if (text) payload.text = text
  if (replyTo) payload.reply_to = replyTo

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error: ${res.status} ${body}`)
  }
}

import { getDatabase } from "./mongodb"

// Resolve recipients by role subscriptions and send to each
export async function sendForEvent(eventKey: string, subject: string, html: string, text?: string) {
  const db = await getDatabase()
  const rolesCol = db.collection("roles")
  const usersCol = db.collection("users")

  // Find roles subscribed to this event
  const roles = await rolesCol.find({ emailSubscriptions: eventKey }).toArray()
  const roleIds = roles.map((r: { _id: unknown }) => String(r._id))

  // allowlist super-admin emails
  const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(/[,\n;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  // find users who are super-admins (role === 'admin' or in allowlist) or have the role id in their roles array
  const orArray: Array<Record<string, unknown>> = [
    { role: "admin" },
    { email: { $in: allowlist } },
  ]
  if (roleIds.length > 0) {
    orArray.push({ roles: { $in: roleIds } })
  }
  const query = { $or: orArray }

  const admins = await usersCol.find(query, { projection: { email: 1 } }).toArray() as Array<{ email?: string }>
  const uniqueEmails = Array.from(new Set(admins.map((a) => String(a.email || "").toLowerCase())))

  await Promise.all(uniqueEmails.map((email) => sendEmail({ to: email, subject, html, text })))
}
