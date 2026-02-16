import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

type PageDoc = {
  _id?: unknown
  title: string
  slug: string
  status: "draft" | "published"
  content: string
  excerpt?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
    ogImage?: string
    schemaJsonLd?: string
  }
  createdAt: Date
  updatedAt: Date
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  try {
    const db = await getDatabase()
    const pages = await db
      .collection<PageDoc>("pages")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Admin pages GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const title = String(body.title || "").trim()
    const slug = normalizeSlug(String(body.slug || title))

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    const now = new Date()
    const doc: PageDoc = {
      title,
      slug,
      status: body.status === "published" ? "published" : "draft",
      content: String(body.content || ""),
      excerpt: String(body.excerpt || ""),
      seo: {
        metaTitle: String(body?.seo?.metaTitle || ""),
        metaDescription: String(body?.seo?.metaDescription || ""),
        canonicalUrl: String(body?.seo?.canonicalUrl || ""),
        ogImage: String(body?.seo?.ogImage || ""),
        schemaJsonLd: String(body?.seo?.schemaJsonLd || ""),
      },
      createdAt: now,
      updatedAt: now,
    }

    const db = await getDatabase()
    const existing = await db.collection<PageDoc>("pages").findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    const result = await db.collection<PageDoc>("pages").insertOne(doc)
    return NextResponse.json({ page: { ...doc, _id: result.insertedId } }, { status: 201 })
  } catch (error) {
    console.error("Admin pages POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
