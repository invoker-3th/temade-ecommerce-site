import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { UserService } from "@/lib/services/userServices"
import { getDatabase } from "@/lib/mongodb"
import { sendEmail } from "@/lib/email"
import { generateOtp, signEmailVerificationJwt } from "@/lib/verificationTokens"
import type { User } from "@/lib/models/User"

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const verifyLink = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}&otp=${encodeURIComponent(otp)}`

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Welcome to Temade Studios</h2>
        <p>Hi ${newUser.userName || "there"},</p>
        <p>Thanks for joining Temade. Your one-time passcode (OTP) is:</p>
        <p style="font-size: 22px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
        <p>Click the button below to verify your email:</p>
        <p><a href="${verifyLink}" style="background:#8D2741;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
        <p>If the button doesn't work, open this link:</p>
        <p>${verifyLink}</p>
      </div>
    `

    let emailSent = true
    try {
      await sendEmail({
        to: newUser.email,
        subject: "Verify your Temade account",
        html,
        text: `Welcome to Temade. Your OTP is ${otp}. Verify here: ${verifyLink}`,
      })
    } catch (error) {
      emailSent = false
      console.error("Verification email error:", error)
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
