import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userServices"
import type { User } from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, phone, cart = [], wishlist = [] } = body

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Email, first name, and last name are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create new user
    const userData: Omit<User, "_id" | "createdAt" | "updatedAt"> = {
      email,
      userName: body.userName,
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

    // Remove sensitive data before sending response
    const { ...userResponse } = newUser

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userResponse,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
