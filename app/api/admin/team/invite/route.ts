import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { UserService } from "@/lib/services/userServices"
import { sendEmail } from "@/lib/email"
import { signAdminInviteJwt } from "@/lib/verificationTokens"
import type { User } from "@/lib/models/User"

type InviteDoc = {
  _id?: ObjectId
  userId: ObjectId
  email: string
  userName: string
  token: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
  createdByEmail?: string
}

export async function GET() {
  try {
    const db = await getDatabase()
    const usersCol = db.collection<User>("users")
    const invitesCol = db.collection<InviteDoc>("admin_invites")

    const [admins, pendingInvites] = await Promise.all([
      usersCol
        .find(
          { role: "admin" },
          { projection: { email: 1, userName: 1, isEmailVerified: 1, updatedAt: 1, createdAt: 1 } }
        )
        .sort({ updatedAt: -1 })
        .toArray(),
      invitesCol
        .find(
          { usedAt: null, expiresAt: { $gt: new Date() } },
          { projection: { email: 1, userName: 1, createdAt: 1, expiresAt: 1 } }
        )
        .sort({ createdAt: -1 })
        .toArray(),
    ])

    return NextResponse.json({ admins, pendingInvites })
  } catch (error) {
    console.error("Admin team GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email || "").trim().toLowerCase()
    const userName = String(body.userName || "").trim()

    if (!email || !userName) {
      return NextResponse.json({ error: "Email and username are required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const invitesCol = db.collection<InviteDoc>("admin_invites")
    const secret = process.env.EMAIL_VERIFICATION_JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Email verification secret is missing" }, { status: 500 })
    }

    let user = await UserService.getUserByEmail(email)
    if (!user) {
      const userData: Omit<User, "_id" | "createdAt" | "updatedAt"> = {
        email,
        userName,
        phone: "",
        cart: [],
        wishlist: [],
        orders: [],
        role: "customer",
        disabled: false,
        isEmailVerified: false,
        preferences: {
          newsletter: false,
          notifications: true,
        },
      }
      user = await UserService.createUser(userData)
    } else if (!user.userName || user.userName !== userName) {
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { userName, updatedAt: new Date() } }
      )
    }

    const tokenTtlMinutes = Number(process.env.ADMIN_INVITE_TOKEN_TTL_MINUTES || 60 * 24)
    const userId = String(user._id)
    const { token, payload } = signAdminInviteJwt({
      userId,
      email,
      secret,
      expiresInSeconds: tokenTtlMinutes * 60,
    })
    const expiresAt = new Date(payload.exp * 1000)

    const alreadyPending = await invitesCol.findOne({ email, usedAt: null, expiresAt: { $gt: new Date() } })
    if (alreadyPending) {
      return NextResponse.json({ error: "An active invite already exists for this email" }, { status: 409 })
    }

    await invitesCol.insertOne({
      userId: new ObjectId(userId),
      email,
      userName,
      token,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
      createdByEmail: String(body.createdByEmail || "").trim().toLowerCase() || undefined,
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const inviteLink = `${baseUrl}/auth/admin-invite?token=${encodeURIComponent(token)}`

    await sendEmail({
      to: email,
      subject: "Temade Admin Invite",
      html: `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>You're invited as a Temade Admin</h2>
          <p>Hello ${userName},</p>
          <p>Click the button below to confirm your admin account and verify your email.</p>
          <p><a href="${inviteLink}" style="background:#8D2741;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Confirm Admin Access</a></p>
          <p>If the button doesn't work, use this link:</p>
          <p>${inviteLink}</p>
        </div>
      `,
      text: `You are invited as a Temade Admin. Confirm access: ${inviteLink}`,
    })

    return NextResponse.json({ success: true, inviteLink }, { status: 201 })
  } catch (error) {
    console.error("Admin team POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
