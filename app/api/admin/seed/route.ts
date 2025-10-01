import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { baseCategoryImages } from "@/app/data/shopCategories"

export async function POST() {
  try {
    const db = await getDatabase()
    const products = db.collection("products")

    let inserted = 0

    for (const [categoryName, items] of Object.entries(baseCategoryImages)) {
      for (const item of items) {
        const existing = await products.findOne({ name: item.name })
        if (existing) continue

        const colorVariants = (item.colorVariants || []).map((cv) => ({
          colorName: cv.colorName,
          images: (cv.images || []).map((img) => ({ src: img.src, alt: img.alt })),
        }))

        const doc = {
          sku: item.id,
          name: item.name,
          description: item.description || "",
          category: categoryName,
          subCategory: undefined,
          priceNGN: typeof item.price === "number" ? item.price : Number(item.price) || 0,
          priceUSD: (item as unknown as { priceUSD?: number }).priceUSD,
          priceGBP: (item as unknown as { priceGBP?: number }).priceGBP,
          sizes: item.sizes || [],
          colorVariants,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await products.insertOne(doc)
        inserted += 1
      }
    }

    return NextResponse.json({ message: "Seed complete", inserted })
  } catch (err) {
    console.error("Seed error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


