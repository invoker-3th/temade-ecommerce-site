import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Map search prefixes to full category names
const categoryMap: Record<string, string[]> = {
  't': ['TOPS'],
  'to': ['TOPS'],
  'top': ['TOPS'],
  'tops': ['TOPS'],
  's': ['SKIRTS'],
  'sk': ['SKIRTS'],
  'ski': ['SKIRTS'],
  'skir': ['SKIRTS'],
  'skirt': ['SKIRTS'],
  'skirts': ['SKIRTS'],
  'p': ['PANTS'],
  'pa': ['PANTS'],
  'pan': ['PANTS'],
  'pant': ['PANTS'],
  'pants': ['PANTS'],
  'd': ['DRESSES'],
  'dr': ['DRESSES'],
  'dre': ['DRESSES'],
  'dres': ['DRESSES'],
  'dress': ['DRESSES'],
  'dresses': ['DRESSES'],
  'j': ['JACKETS'],
  'ja': ['JACKETS'],
  'jac': ['JACKETS'],
  'jack': ['JACKETS'],
  'jacke': ['JACKETS'],
  'jacket': ['JACKETS'],
  'jackets': ['JACKETS'],
}

// Get matching categories for a search query
function getMatchingCategories(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim()
  
  // Check exact matches first
  if (categoryMap[lowerQuery]) {
    return categoryMap[lowerQuery]
  }
  
  // Check if query is a prefix of any category
  const matchingCategories: string[] = []
  const allCategories = ['TOPS', 'SKIRTS', 'PANTS', 'DRESSES', 'JACKETS']
  
  for (const category of allCategories) {
    if (category.toLowerCase().startsWith(lowerQuery)) {
      matchingCategories.push(category)
    }
  }
  
  return matchingCategories
}

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
      // Get categories that match the query prefix
      const matchingCategories = getMatchingCategories(q)
      
      // Build search query
      const orConditions: Array<Record<string, unknown>> = [
        { name: { $regex: q, $options: 'i' } }, // Match anywhere in product name
        { description: { $regex: q, $options: 'i' } }, // Match in description
      ]
      
      // If query matches category prefix, add category filter
      if (matchingCategories.length > 0) {
        orConditions.push({ category: { $in: matchingCategories } })
      } else {
        // Also check if category contains the query (for partial matches)
        orConditions.push({ category: { $regex: q, $options: 'i' } })
      }
      
      query = { $or: orConditions }
    }

    const results = await productsCol.find(query).limit(50).toArray()
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

