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
