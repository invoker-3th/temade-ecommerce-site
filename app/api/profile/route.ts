import { NextRequest, NextResponse } from "next/server"
import { ProfileService } from "@/lib/services/profileService"

// POST: Create or update profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, ...profileData } = body

    if (!userId || !profileData.fullName || !profileData.email) {
      return NextResponse.json(
        { error: "userId, fullName, and email are required" },
        { status: 400 }
      )
    }

    const profile = await ProfileService.createOrUpdateProfile(userId, profileData)

    return NextResponse.json(
      { message: "Profile saved successfully", profile },
      { status: 201 }
    )
  } catch (error) {
    console.error("Profile save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: Fetch profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const profile = await ProfileService.getProfile(userId)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile, { status: 200 })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Update profile
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const updatedProfile = await ProfileService.updateProfile(userId, updates)

    if (!updatedProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(
      { message: "Profile updated successfully", profile: updatedProfile },
      { status: 200 }
    )
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
