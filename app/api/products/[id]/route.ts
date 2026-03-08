import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

/**
 * Public endpoint for fetching a single product by ID.
 * No authentication required - used by shop product detail pages.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const product = await db.collection("products").findOne({ _id: new ObjectId(id) })
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: "Failed to get product" },
      { status: 500 }
    )
  }
}

