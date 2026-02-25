import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { UserService } from "@/lib/services/userServices"
import type { User } from "@/lib/models/User"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

type UserRow = {
  _id: ObjectId
  email: string
  userName: string
  phone?: string
  role?: string
  disabled?: boolean
  createdAt?: Date
  updatedAt?: Date
  address?: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
}

export async function GET(request: Request) {
  const perm = await requirePermissionFromRequest(request, "users:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200)

    const db = await getDatabase()
    const usersCol = db.collection<UserRow>("users")
    const ordersCol = db.collection("orders")

    const filter: Record<string, unknown> = {}
    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { userName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { "address.city": { $regex: q, $options: "i" } },
        { "address.state": { $regex: q, $options: "i" } },
      ]
    }

    const users = await usersCol
      .find(filter, { projection: { cart: 0, wishlist: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    const userIds = users.map((u) => u._id).filter(Boolean)

    const stats = userIds.length
      ? await ordersCol
          .aggregate([
            { $match: { userId: { $in: userIds } } },
            {
              $group: {
                _id: "$userId",
                orders: { $sum: 1 },
                revenue: { $sum: "$total" },
                lastOrderAt: { $max: "$createdAt" },
              },
            },
          ])
          .toArray()
      : []

    const statsMap = new Map(
      stats.map((row) => [String(row._id), row])
    )

    const rows = users.map((user) => {
      const stat = statsMap.get(String(user._id))
      return {
        ...user,
        orders: stat?.orders || 0,
        revenue: stat?.revenue || 0,
        lastOrderAt: stat?.lastOrderAt || null,
      }
    })

    const count = await usersCol.countDocuments(filter)

    return NextResponse.json({ users: rows, count })
  } catch (error) {
    console.error("Admin users GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "users:manage")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })
  try {
    const body = await request.json()
    const { email, userName, phone } = body

    if (!email || !userName) {
      return NextResponse.json({ error: "Email and username are required" }, { status: 400 })
    }

    const existingUser = await UserService.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const userData: Omit<User, "_id" | "createdAt" | "updatedAt"> = {
      email,
      userName,
      phone,
      cart: [],
      wishlist: [],
      orders: [],
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: "admin",
      preferences: {
        newsletter: false,
        notifications: true,
      },
    }

    const newUser = await UserService.createUser(userData)
    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error("Admin users POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
