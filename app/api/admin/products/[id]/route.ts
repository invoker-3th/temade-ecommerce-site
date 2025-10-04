import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Use getDatabase() instead of connecting directly
    const db = await getDatabase()
    
    // Normalize sizes
    const sizes = Array.isArray(body.sizes)
      ? body.sizes
      : typeof body.sizes === 'string'
        ? body.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []

    // Prefer already structured colorVariants if provided; otherwise, derive from flat fields
    const colorVariants = Array.isArray(body.colorVariants) && body.colorVariants.length > 0
      ? body.colorVariants
      : (body.colorName || body.images)
        ? [{
            colorName: body.colorName,
            hexCode: body.colorHex,
            images: (Array.isArray(body.images) ? body.images : []).map((src: string) => ({ src, alt: body.name }))
          }]
        : []

    // Normalize price and category inputs
    const priceNGN = body.priceNGN != null ? Number(body.priceNGN) : (body.price != null ? Number(body.price) : undefined)
    const priceUSD = body.priceUSD != null ? Number(body.priceUSD) : undefined
    const priceGBP = body.priceGBP != null ? Number(body.priceGBP) : undefined
    const category = body.category ?? body.categoryId

    // Build update payload and remove undefined keys
    const updateDataRaw = {
      name: body.name,
      sku: body.sku,
      description: body.description,
      category,
      priceNGN,
      priceUSD,
      priceGBP,
      sizes,
      colorVariants,
      updatedAt: new Date(),
    }
    const updateData = Object.fromEntries(
      Object.entries(updateDataRaw).filter(([, v]) => v !== undefined)
    )

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) })
    if (!result.deletedCount) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}