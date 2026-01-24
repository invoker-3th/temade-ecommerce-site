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
      // Match product name (anywhere in the name, not just prefix), category, or description
      // This allows searching for "Loop" to find "Loop Top" and "Bass" to find "Bass Pants"
      query = {
        $or: [
          { name: { $regex: q, $options: 'i' } }, // Match anywhere in name
          { category: { $regex: `^${q}$`, $options: 'i' } },
          { category: { $regex: `^${q}`, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }, // Also search in description if available
        ],
      }
    }

    const results = await productsCol.find(query).limit(50).toArray()
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

