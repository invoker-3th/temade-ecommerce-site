import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getPublicIdFromUrl(url: string) {
  const parts = url.split("/upload/")
  if (parts.length < 2) return null
  let after = parts[1]
  // remove version prefix like v123456/
  after = after.replace(/^v\d+\//, "")
  const dot = after.lastIndexOf(".")
  return dot === -1 ? after : after.substring(0, dot)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const urls: string[] = Array.isArray(body.urls) ? body.urls : [body.url].filter(Boolean)

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: "No urls provided" }, { status: 400 })
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        const publicId = getPublicIdFromUrl(url)
        if (!publicId) return { url, ok: false, reason: "could-not-parse-public-id" }
        try {
          const res = await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" })
          return { url, ok: res.result === "ok" || res.result === "not found", raw: res }
        } catch (err) {
          return { url, ok: false, reason: (err as Error).message }
        }
      })
    )

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error("delete-image error:", err)
    return NextResponse.json({ error: "Delete failed", details: (err as Error).message }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}