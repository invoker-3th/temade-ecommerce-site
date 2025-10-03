import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Use getDatabase() instead of connecting directly
    const db = await getDatabase()
    
    // Convert sizes string to array if needed
    const sizes = typeof body.sizes === 'string' 
      ? body.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
      : body.sizes

    // Prepare update data
    const updateData = {
      name: body.name,
      sku: body.sku,
      description: body.description,
      category: body.categoryId,
      priceNGN: Number(body.price),
      priceUSD: body.priceUSD ? Number(body.priceUSD) : undefined,
      priceGBP: body.priceGBP ? Number(body.priceGBP) : undefined,
      sizes,
      colorVariants: [{
        colorName: body.colorName,
        hexCode: body.colorHex,
        images: body.images.map((src: string) => ({ src, alt: body.name }))
      }]
    }

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}