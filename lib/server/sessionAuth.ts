import crypto from "crypto"
import { getDatabase } from "@/lib/mongodb"

export const ADMIN_SESSION_COOKIE = "temade_admin_session"

type AdminSessionDoc = {
  _id?: unknown
  tokenHash: string
  email: string
  role?: string
  userId?: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  revokedAt?: Date | null
}

type SessionShape = {
  expiresAt: Date
  revokedAt?: Date | null
}

function getSessionTtlMs() {
  const hours = Number(process.env.ADMIN_SESSION_TTL_HOURS || 12)
  return Math.max(1, hours) * 60 * 60 * 1000
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function parseCookieFromHeader(cookieHeader: string, cookieName: string) {
  if (!cookieHeader) return ""
  const parts = cookieHeader.split(";").map((c) => c.trim())
  const hit = parts.find((p) => p.startsWith(`${cookieName}=`))
  if (!hit) return ""
  return decodeURIComponent(hit.slice(cookieName.length + 1))
}

export function isSessionActive(session: SessionShape, now: Date = new Date()) {
  if (session.revokedAt) return false
  return session.expiresAt > now
}

function readCookie(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get("cookie") || ""
  return parseCookieFromHeader(cookieHeader, cookieName)
}

export async function createAdminSession(input: { email: string; role?: string; userId?: string }) {
  const token = crypto.randomBytes(32).toString("base64url")
  const tokenHash = hashToken(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + getSessionTtlMs())

  const db = await getDatabase()
  await db.collection<AdminSessionDoc>("admin_auth_sessions").insertOne({
    tokenHash,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
    expiresAt,
    revokedAt: null,
  })

  return { token, expiresAt }
}

export async function getAdminSessionFromRequest(request: Request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE)
  if (!token) return null

  const db = await getDatabase()
  const now = new Date()
  const tokenHash = hashToken(token)
  const session = await db.collection<AdminSessionDoc>("admin_auth_sessions").findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: now },
  })
  if (!session) return null
  if (!isSessionActive(session, now)) return null

  await db.collection<AdminSessionDoc>("admin_auth_sessions").updateOne(
    { tokenHash },
    { $set: { updatedAt: now } }
  )

  return {
    email: session.email,
    role: session.role,
    userId: session.userId,
    expiresAt: session.expiresAt,
  }
}

export async function revokeAdminSessionFromRequest(request: Request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE)
  if (!token) return
  const tokenHash = hashToken(token)
  const db = await getDatabase()
  await db.collection<AdminSessionDoc>("admin_auth_sessions").updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date(), updatedAt: new Date() } }
  )
}

export function getAdminSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  }
}

export function getAdminSessionClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  }
}
