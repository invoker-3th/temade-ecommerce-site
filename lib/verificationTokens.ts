import crypto from "crypto"

type VerificationPayload = {
  sub: string
  email: string
  typ: "email_verify" | "admin_invite" | "admin_otp"
  exp: number
  iat: number
}

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64url")
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf-8")
}

function hmacSha256(data: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url")
}

export function signEmailVerificationJwt(params: {
  userId: string
  email: string
  secret: string
  expiresInSeconds: number
}) {
  const now = Math.floor(Date.now() / 1000)
  const payload: VerificationPayload = {
    sub: params.userId,
    email: params.email,
    typ: "email_verify",
    iat: now,
    exp: now + params.expiresInSeconds,
  }

  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const signature = hmacSha256(unsigned, params.secret)
  const token = `${unsigned}.${signature}`

  return { token, payload }
}

export function signAdminInviteJwt(params: {
  userId: string
  email: string
  secret: string
  expiresInSeconds: number
}) {
  const now = Math.floor(Date.now() / 1000)
  const payload: VerificationPayload = {
    sub: params.userId,
    email: params.email,
    typ: "admin_invite",
    iat: now,
    exp: now + params.expiresInSeconds,
  }

  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const signature = hmacSha256(unsigned, params.secret)
  const token = `${unsigned}.${signature}`

  return { token, payload }
}

export function signAdminOtpJwt(params: {
  userId: string
  email: string
  secret: string
  expiresInSeconds: number
}) {
  const now = Math.floor(Date.now() / 1000)
  const payload: VerificationPayload = {
    sub: params.userId,
    email: params.email,
    typ: "admin_otp",
    iat: now,
    exp: now + params.expiresInSeconds,
  }

  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const signature = hmacSha256(unsigned, params.secret)
  const token = `${unsigned}.${signature}`

  return { token, payload }
}

export function verifyEmailVerificationJwt(token: string, secret: string) {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, signature] = parts
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const expected = hmacSha256(unsigned, secret)
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return null
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as VerificationPayload
    if (payload.typ !== "email_verify") return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function verifyAdminInviteJwt(token: string, secret: string) {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, signature] = parts
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const expected = hmacSha256(unsigned, secret)
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return null
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as VerificationPayload
    if (payload.typ !== "admin_invite") return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function verifyAdminOtpJwt(token: string, secret: string) {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, signature] = parts
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const expected = hmacSha256(unsigned, secret)
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return null
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as VerificationPayload
    if (payload.typ !== "admin_otp") return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function generateOtp(length = 6) {
  const min = 10 ** (length - 1)
  const max = 10 ** length - 1
  return String(crypto.randomInt(min, max + 1))
}
