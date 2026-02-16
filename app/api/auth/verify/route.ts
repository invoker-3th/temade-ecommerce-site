import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { verifyEmailVerificationJwt } from "@/lib/verificationTokens"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const secret = process.env.EMAIL_VERIFICATION_JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Email verification secret is missing" }, { status: 500 })
    }

    const payload = verifyEmailVerificationJwt(token, secret)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const db = await getDatabase()
    const record = await db.collection("email_verifications").findOne({
      token,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })

    if (!record) {
      return NextResponse.json({ error: "Verification link is no longer valid" }, { status: 400 })
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(payload.sub) },
      { $set: { isEmailVerified: true, emailVerifiedAt: new Date(), updatedAt: new Date() } }
    )

    await db.collection("email_verifications").updateOne(
      { _id: record._id },
      { $set: { usedAt: new Date() } }
    )

    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) })
    return NextResponse.json({ verified: true, user })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
