import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

type PageDoc = {
  title?: string
  slug?: string
  status?: "draft" | "published"
  content?: string
  excerpt?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
    ogImage?: string
    schemaJsonLd?: string
  }
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const page = await db.collection("pages").findOne({ _id: new ObjectId(id) })

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error("Admin pages GET by id error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updates: PageDoc = {
      title: body.title,
      slug: body.slug ? normalizeSlug(String(body.slug)) : undefined,
      status: body.status === "published" ? "published" : "draft",
      content: body.content,
      excerpt: body.excerpt,
      seo: {
        metaTitle: body?.seo?.metaTitle || "",
        metaDescription: body?.seo?.metaDescription || "",
        canonicalUrl: body?.seo?.canonicalUrl || "",
        ogImage: body?.seo?.ogImage || "",
        schemaJsonLd: body?.seo?.schemaJsonLd || "",
      },
    }

    const db = await getDatabase()

    if (updates.slug) {
      const existing = await db.collection("pages").findOne({ slug: updates.slug, _id: { $ne: new ObjectId(id) } })
      if (existing) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    const result = await db.collection("pages").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )

    if (!result.matchedCount) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin pages PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const result = await db.collection("pages").deleteOne({ _id: new ObjectId(id) })

    if (!result.deletedCount) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin pages DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
