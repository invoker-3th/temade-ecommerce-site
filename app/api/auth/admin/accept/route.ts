import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminInviteJwt } from "@/lib/verificationTokens"
import { writeAuditLog } from "@/lib/audit"

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

    const payload = verifyAdminInviteJwt(token, secret)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 400 })
    }

    const db = await getDatabase()
    const invite = await db.collection("admin_invites").findOne({
      token,
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })

    if (!invite) {
      return NextResponse.json({ error: "Invite is no longer valid" }, { status: 400 })
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(payload.sub) },
      {
        $set: {
          role: "admin",
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    await db.collection("admin_invites").updateOne(
      { _id: invite._id },
      { $set: { usedAt: new Date() } }
    )

    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) })
    await writeAuditLog({
      actorEmail: payload.email.toLowerCase(),
      action: "admin_activated",
      targetEmail: payload.email.toLowerCase(),
      targetId: payload.sub,
      metadata: { inviteId: String(invite._id) },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Admin invite accept error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
