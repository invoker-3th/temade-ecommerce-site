import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminOtpJwt } from "@/lib/verificationTokens"
import { ADMIN_SESSION_COOKIE, createAdminSession, getAdminSessionCookieOptions } from "@/lib/server/sessionAuth"

type AdminLoginOtpDoc = {
  _id?: ObjectId
  email: string
  token: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = String(searchParams.get("token") || "").trim()
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const secret = process.env.EMAIL_VERIFICATION_JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Email verification secret is missing" }, { status: 500 })
    }

    const payload = verifyAdminOtpJwt(token, secret)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired OTP link" }, { status: 400 })
    }

    const db = await getDatabase()
    const otpCol = db.collection<AdminLoginOtpDoc>("admin_login_otps")
    const otpRecord = await otpCol.findOne({
      token,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })
    if (!otpRecord) {
      return NextResponse.json({ error: "OTP link is no longer valid" }, { status: 400 })
    }

    const user = await db.collection("users").findOne({
      _id: new ObjectId(payload.sub),
      email: { $regex: `^${payload.email}$`, $options: "i" },
      isEmailVerified: true,
      disabled: { $ne: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User account is not eligible for admin OTP login" }, { status: 403 })
    }

    await otpCol.updateOne({ _id: otpRecord._id }, { $set: { usedAt: new Date() } })

    const session = await createAdminSession({
      email: String(user.email),
      role: String(user.role || ""),
      userId: String(user._id),
    })

    const response = NextResponse.json({
      success: true,
      user,
    })
    response.cookies.set(ADMIN_SESSION_COOKIE, session.token, getAdminSessionCookieOptions(session.expiresAt))
    return response
  } catch (error) {
    console.error("Admin OTP verify error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

