import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const db = await getDatabase()
    const page = await db.collection("pages").findOne({ slug, status: "published" })

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error("Public page GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
