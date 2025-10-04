import { NextResponse } from "next/server"
import { ProductService } from "@/lib/services/productService"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params
    const products = await ProductService.listByCategory(decodeURIComponent(category))
    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products by category error:', error)
    return NextResponse.json(
      { error: "Failed to get products" },
      { status: 500 }
    )
  }
}
