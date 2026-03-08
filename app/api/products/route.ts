import { NextResponse } from "next/server"
import { ProductService } from "@/lib/services/productService"

/**
 * Public endpoint for fetching products.
 * No authentication required - used by shop pages.
 */
export async function GET() {
  try {
    const items = await ProductService.list()
    return NextResponse.json(items)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: "Failed to get products" },
      { status: 500 }
    )
  }
}

