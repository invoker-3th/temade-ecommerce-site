import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userServices"

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

    // In a real app, you'd verify password here
    // For this demo, we'll just return user data

    const { ...userResponse } = user

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
