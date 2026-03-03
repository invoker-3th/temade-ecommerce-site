import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { UserService } from "@/lib/services/userServices"
import { getDatabase } from "@/lib/mongodb"
import { sendEmail } from "@/lib/email"
import { signupVerificationEmail, adminNewUserEmail } from "@/lib/emailTemplates"
import { generateOtp, signEmailVerificationJwt } from "@/lib/verificationTokens"
import type { User } from "@/lib/models/User"

function parseEmailList(raw: string) {
  return String(raw || "")
    .split(/[,\n;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userName, phone, cart = [], wishlist = [] } = body

    // Validate required fields
    if (!email || !userName) {
      return NextResponse.json({ error: "Email and userName are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create new user
    const userData: Omit<User, "_id" | "createdAt" | "updatedAt"> = {
      email,
      userName,
      phone,
      cart,
      wishlist,
      orders: [],
      isEmailVerified: false,
      preferences: {
        newsletter: false,
        notifications: true,
      },
    }

    const newUser = await UserService.createUser(userData)

    const secret = process.env.EMAIL_VERIFICATION_JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Email verification secret is missing" }, { status: 500 })
    }

    const tokenTtlMinutes = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60 * 24)
    const otpTtlMinutes = Number(process.env.EMAIL_VERIFICATION_OTP_TTL_MINUTES || 30)
    const { token, payload } = signEmailVerificationJwt({
      userId: String(newUser._id),
      email: newUser.email,
      secret,
      expiresInSeconds: tokenTtlMinutes * 60,
    })
    const otp = generateOtp(6)
    const expiresAt = new Date(payload.exp * 1000)
    const otpExpiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000)

    const db = await getDatabase()
    const userObjectId = newUser._id instanceof ObjectId ? newUser._id : new ObjectId(newUser._id)
    await db.collection("email_verifications").insertOne({
      userId: userObjectId,
      email: newUser.email,
      token,
      otp,
      expiresAt,
      otpExpiresAt,
      createdAt: new Date(),
      usedAt: null,
    })

    await db.collection("notifications").insertOne({
      type: "new_user",
      title: "New user joined",
      message: `${newUser.userName} (${newUser.email}) created a new account.`,
      userId: String(newUser._id),
      userEmail: newUser.email,
      read: false,
      createdAt: new Date(),
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const verifyLink = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}&otp=${encodeURIComponent(otp)}`

    const verificationTemplate = signupVerificationEmail({
      userName: newUser.userName,
      otp,
      verifyLink,
    })

    let emailSent = true
    try {
      console.info("[auth.register] Sending verification email", {
        email: newUser.email.toLowerCase(),
        otpExpiresAt: otpExpiresAt.toISOString(),
        tokenExpiresAt: expiresAt.toISOString(),
      })
      await sendEmail({
        to: newUser.email,
        subject: verificationTemplate.subject,
        html: verificationTemplate.html,
        text: verificationTemplate.text,
      })
      console.info("[auth.register] Verification email sent", {
        email: newUser.email.toLowerCase(),
      })
    } catch (error) {
      emailSent = false
      console.error("[auth.register] Verification email failed", {
        email: newUser.email.toLowerCase(),
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Notify admins via email about new user signups (in addition to in-app notification)
    try {
      const adminEmails = parseEmailList(
        process.env.ADMIN_SIGNUP_NOTIFY_EMAILS ||
          process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
          ""
      )

      if (adminEmails.length) {
        const baseUrlNotify = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        const adminLink = `${baseUrlNotify}/admin/users?userId=${encodeURIComponent(String(newUser._id))}`
        const adminTemplate = adminNewUserEmail({ userName: newUser.userName, email: newUser.email, userId: String(newUser._id), userLink: adminLink })
        for (const a of adminEmails) {
          try {
            console.info("[auth.register] Sending admin new-user notification email", {
              recipient: a.toLowerCase(),
              newUserEmail: newUser.email.toLowerCase(),
            })
            await sendEmail({ to: a, subject: adminTemplate.subject, html: adminTemplate.html, text: adminTemplate.text })
            console.info("[auth.register] Admin new-user notification sent", {
              recipient: a.toLowerCase(),
            })
          } catch (mailErr) {
            console.error("[auth.register] Admin new-user notification failed", {
              recipient: a.toLowerCase(),
              error: mailErr instanceof Error ? mailErr.message : String(mailErr),
            })
          }
        }
      }
    } catch (err) {
      console.error("[auth.register] Failed while processing admin new-user notifications", err)
    }

    // Remove sensitive data before sending response
    const { ...userResponse } = newUser

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userResponse,
        verificationLink: verifyLink,
        otp,
        emailSent,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
