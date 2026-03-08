import { NextResponse } from "next/server"
import { CategoryService } from "@/lib/services/categoryService"

/**
 * Public endpoint for fetching categories.
 * No authentication required - used by shop pages.
 */
export async function GET() {
  try {
    const items = await CategoryService.list()
    return NextResponse.json(items)
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: "Failed to get categories" },
      { status: 500 }
    )
  }
}

