import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userServices"
import { sendEmail } from "@/lib/email"
import { getDatabase } from "@/lib/mongodb"

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
    const isAdmin = user.role === "admin" || adminAllow.includes(user.email.toLowerCase())
    if (isAdmin) {
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
    try {
      const now = new Date().toISOString()
      const isAdminLogin = isAdmin ? "Yes" : "No"
      await sendEmail({
        to: user.email,
        subject: "Welcome back to Temade Studios",
        html: `
          <div style="font-family: Arial, sans-serif; color: #222;">
            <h2>Welcome back, ${user.userName}</h2>
            <p>Your login was successful.</p>
            <p>Email: <strong>${user.email}</strong></p>
            <p>Admin access: <strong>${isAdminLogin}</strong></p>
            <p>Time: ${now}</p>
          </div>
        `,
        text: `Welcome back, ${user.userName}. Login successful at ${now}. Admin access: ${isAdminLogin}.`,
      })
    } catch (error) {
      console.error("Login welcome email error:", error)
    }

    if (isAdmin) {
      const notifyTo = "enjayjerey@gmail.com"
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
          await sendEmail({
            to: notifyTo,
            subject: "Admin login detected",
            html: `
              <div style="font-family: Arial, sans-serif; color: #222;">
                <h2>Admin login detected</h2>
                <p>User: <strong>${user.userName}</strong></p>
                <p>Email: <strong>${user.email}</strong></p>
                <p>Time: ${now}</p>
                <p>IP: ${forwardedFor}</p>
                <p>User-Agent: ${ua}</p>
              </div>
            `,
            text: `Admin login detected. User: ${user.userName}. Email: ${user.email}. Time: ${now}. IP: ${forwardedFor}. UA: ${ua}`,
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

    return NextResponse.json(
      {
        message: "Login successful",
        user: userResponse,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
