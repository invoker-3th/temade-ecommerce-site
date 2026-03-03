type SendEmailParams = {
  to: string
  subject: string
  html: string
  text?: string
}

function maskEmail(value: string) {
  const email = String(value || "").trim().toLowerCase()
  const [local, domain] = email.split("@")
  if (!local || !domain) return email || "unknown"
  const maskedLocal = local.length <= 2 ? `${local[0] || "*"}*` : `${local[0]}***${local[local.length - 1]}`
  return `${maskedLocal}@${domain}`
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL
  const replyTo = process.env.RESEND_REPLY_TO

  if (!apiKey || !from) {
    console.error("[email.send] Resend not configured", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
      to: maskEmail(to),
      subject,
    })
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

  console.info("[email.send] Sending email", {
    to: maskEmail(to),
    from: maskEmail(from),
    subject,
    hasText: Boolean(text),
    hasReplyTo: Boolean(replyTo),
  })

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const rawBody = await res.text()
  if (!res.ok) {
    console.error("[email.send] Send failed", {
      to: maskEmail(to),
      subject,
      status: res.status,
      responseBody: rawBody,
    })
    throw new Error(`Resend error: ${res.status} ${rawBody}`)
  }

  let messageId = ""
  try {
    const parsed = rawBody ? JSON.parse(rawBody) as { id?: string } : {}
    messageId = String(parsed.id || "")
  } catch {
    // Ignore JSON parse failures and keep logging without id.
  }

  console.info("[email.send] Email sent", {
    to: maskEmail(to),
    subject,
    status: res.status,
    messageId: messageId || undefined,
  })
}

import { getDatabase } from "./mongodb"

// Resolve recipients by role subscriptions and send to each
export async function sendForEvent(eventKey: string, subject: string, html: string, text?: string) {
  console.info("[email.event] Resolving subscribers", { eventKey, subject })

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

  if (!uniqueEmails.length) {
    console.warn("[email.event] No subscribers found", { eventKey, subject })
    return
  }

  console.info("[email.event] Sending event email", {
    eventKey,
    subject,
    recipientCount: uniqueEmails.length,
  })

  const results = await Promise.allSettled(uniqueEmails.map((email) => sendEmail({ to: email, subject, html, text })))
  const failed = results.filter((result) => result.status === "rejected")

  if (failed.length) {
    console.error("[email.event] Event email delivery had failures", {
      eventKey,
      subject,
      recipientCount: uniqueEmails.length,
      failedCount: failed.length,
      errors: failed.map((f) => (f as PromiseRejectedResult).reason instanceof Error
        ? (f as PromiseRejectedResult).reason.message
        : String((f as PromiseRejectedResult).reason)),
    })
    throw new Error(`Failed to send ${failed.length}/${uniqueEmails.length} event emails for ${eventKey}`)
  }

  console.info("[email.event] Event email delivery complete", {
    eventKey,
    subject,
    recipientCount: uniqueEmails.length,
  })
}
