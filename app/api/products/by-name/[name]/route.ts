import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const db = await getDatabase()
    
    // Find all products with the same name (color variations)
    const products = await db.collection("products")
      .find({ name: decodeURIComponent(name) })
      .toArray()
    
    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Products not found" }, { status: 404 })
    }
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products by name error:', error)
    return NextResponse.json(
      { error: "Failed to get products" },
      { status: 500 }
    )
  }
}
