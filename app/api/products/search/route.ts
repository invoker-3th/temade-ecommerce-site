import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const category = (searchParams.get('category') || '').trim()
    const db = await getDatabase()
    const productsCol = db.collection('products')

    let query: Record<string, unknown> = {}
    if (category) {
      query = { category }
    } else if (q) {
      // Match either name prefix or category name (exact or prefix), case-insensitive
      query = {
        $or: [
          { name: { $regex: `^${q}`, $options: 'i' } },
          { category: { $regex: `^${q}$`, $options: 'i' } },
          { category: { $regex: `^${q}`, $options: 'i' } },
        ],
      }
    }

    const results = await productsCol.find(query).limit(50).toArray()
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

