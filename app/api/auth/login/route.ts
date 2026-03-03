import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userServices"
import { sendEmail, sendForEvent } from "@/lib/email"
import { adminOtpLoginEmail, loginWelcomeEmail } from "@/lib/emailTemplates"
import { getDatabase } from "@/lib/mongodb"
import { ADMIN_SESSION_COOKIE, createAdminSession, getAdminSessionCookieOptions } from "@/lib/server/sessionAuth"
import { signAdminOtpJwt } from "@/lib/verificationTokens"

type AdminLoginOtpDoc = {
  email: string
  token: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userName } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!userName) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Find user by email
    const user = await UserService.getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (user.disabled) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 })
    }
    const adminAllow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(/[,\n;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isOwnerAllowlisted = adminAllow.includes(user.email.toLowerCase())
    const isAdmin = user.role === "admin" || isOwnerAllowlisted
    const userRoles = Array.isArray((user as { roles?: unknown }).roles)
      ? ((user as { roles?: unknown }).roles as unknown[])
      : []
    const hasAssignedRbacRoles = userRoles.length > 0
    const canAccessAdminConsole = isAdmin || hasAssignedRbacRoles
    if (isOwnerAllowlisted) {
      const adminUserName = (process.env.NEXT_PUBLIC_ADMIN_USERNAME || "").trim().toLowerCase()
      if (adminUserName && userName.trim().toLowerCase() !== adminUserName) {
        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
      }
    } else {
      if (!user.isEmailVerified) {
        return NextResponse.json({ error: "Email not verified" }, { status: 403 })
      }
      if ((user.userName || "").trim().toLowerCase() !== userName.trim().toLowerCase()) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
    }

    // In a real app, you'd verify password here
    // For this demo, we'll just return user data

    const { ...userResponse } = user
    if (isAdmin) {
      try {
        const db = await getDatabase()
        const sessionEmail = user.email.toLowerCase()
        const existingSession = await db.collection("admin_login_sessions").findOne({
          email: sessionEmail,
          loggedIn: true,
        })

        if (!existingSession) {
          const forwardedFor = request.headers.get("x-forwarded-for") || "unknown"
          const ua = request.headers.get("user-agent") || "unknown"
          const now = new Date().toISOString()
          const subject = "Admin login detected"
          const html = `
            <div style="font-family: Arial, sans-serif; color: #222;">
              <h2>Admin login detected</h2>
              <p>User: <strong>${user.userName}</strong></p>
              <p>Email: <strong>${user.email}</strong></p>
              <p>Time: ${now}</p>
              <p>IP: ${forwardedFor}</p>
              <p>User-Agent: ${ua}</p>
            </div>
          `
          const text = `Admin login detected. User: ${user.userName}. Email: ${user.email}. Time: ${now}. IP: ${forwardedFor}. UA: ${ua}`
          // Send to admin + manager roles via RBAC emailSubscriptions for "admin.login"
          console.info("[auth.login] Triggering admin.login email event", {
            email: sessionEmail,
            userName: user.userName,
            hasExistingSession: false,
          })
          await sendForEvent("admin.login", subject, html, text)
          console.info("[auth.login] admin.login email event completed", {
            email: sessionEmail,
            userName: user.userName,
          })
        }

        await db.collection("admin_login_sessions").updateOne(
          { email: sessionEmail },
          { $set: { email: sessionEmail, loggedIn: true, updatedAt: new Date() } },
          { upsert: true }
        )
      } catch (error) {
        console.error("Admin login alert error:", error)
      }
    }

    // Owner allowlisted admins can still use direct login.
    if (canAccessAdminConsole && !isOwnerAllowlisted) {
      console.info("[auth.login] Admin OTP flow starting", {
        email: user.email.toLowerCase(),
        isAdmin,
        hasAssignedRbacRoles,
        canAccessAdminConsole,
        isOwnerAllowlisted,
      })

      if (!user.isEmailVerified) {
        console.warn("[auth.login] Admin OTP blocked because email is not verified", {
          email: user.email.toLowerCase(),
        })
        return NextResponse.json({ error: "Verified email is required for admin OTP login." }, { status: 403 })
      }

      const secret = process.env.EMAIL_VERIFICATION_JWT_SECRET
      if (!secret) {
        console.error("[auth.login] Admin OTP failed because EMAIL_VERIFICATION_JWT_SECRET is missing", {
          email: user.email.toLowerCase(),
        })
        return NextResponse.json({ error: "Email verification secret is missing" }, { status: 500 })
      }

      const otpTtlMinutes = Number(process.env.ADMIN_LOGIN_OTP_TTL_MINUTES || 15)
      const { token, payload } = signAdminOtpJwt({
        userId: user._id ? String(user._id) : "",
        email: user.email,
        secret,
        expiresInSeconds: otpTtlMinutes * 60,
      })

      const db = await getDatabase()
      await db.collection<AdminLoginOtpDoc>("admin_login_otps").insertOne({
        email: user.email.toLowerCase(),
        token,
        expiresAt: new Date(payload.exp * 1000),
        usedAt: null,
        createdAt: new Date(),
      })
      console.info("[auth.login] Admin OTP token persisted", {
        email: user.email.toLowerCase(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      })

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      const loginLink = `${baseUrl}/auth/admin-otp?token=${encodeURIComponent(token)}`
      const otpTpl = adminOtpLoginEmail({
        userName: user.userName,
        loginLink,
        expiresMinutes: otpTtlMinutes,
      })
      try {
        console.info("[auth.login] Sending admin OTP email", {
          email: user.email.toLowerCase(),
          expiresMinutes: otpTtlMinutes,
        })
        await sendEmail({
          to: user.email,
          subject: otpTpl.subject,
          html: otpTpl.html,
          text: otpTpl.text,
        })
        console.info("[auth.login] Admin OTP email sent", {
          email: user.email.toLowerCase(),
        })
      } catch (otpEmailError) {
        console.error("[auth.login] Admin OTP email failed", {
          email: user.email.toLowerCase(),
          error: otpEmailError instanceof Error ? otpEmailError.message : String(otpEmailError),
        })
        return NextResponse.json(
          {
            message: "Admin login verification started. If your OTP email is delayed, check spam or try signing in again.",
            requiresAdminOtp: true,
            otpEmailStatus: "delivery_uncertain",
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          message: "OTP link sent to your verified email.",
          requiresAdminOtp: true,
        },
        { status: 200 },
      )
    }

    try {
      const now = new Date().toISOString()
      const welcomeTpl = loginWelcomeEmail({ userName: user.userName, email: user.email, isAdmin, timeISO: now })
      await sendEmail({ to: user.email, subject: welcomeTpl.subject, html: welcomeTpl.html, text: welcomeTpl.text })
    } catch (error) {
      console.error("Login welcome email error:", error)
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: userResponse,
      },
      { status: 200 },
    )

    if (canAccessAdminConsole) {
      const session = await createAdminSession({
        email: user.email,
        role: user.role,
        userId: user._id ? String(user._id) : undefined,
      })
      response.cookies.set(ADMIN_SESSION_COOKIE, session.token, getAdminSessionCookieOptions(session.expiresAt))
    }

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
