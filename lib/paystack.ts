export type PaystackVerifyData = {
  status: string
  reference: string
  paid_at?: string
  gateway_response?: string
  channel?: string
  amount?: number
  currency?: string
  metadata?: { orderId?: string; [key: string]: unknown }
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error("Paystack secret is missing")
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  })
  const data = await res.json()
  return { res, data }
}
