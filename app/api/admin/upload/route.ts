import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "content:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files received" }, { status: 400 })
    }

    // Upload all files to Cloudinary
    const uploadPromises = files.map(async (file) => {
      // Convert file to base64
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileStr = `data:${file.type};base64,${buffer.toString('base64')}`

      // Upload to Cloudinary
      return cloudinary.uploader.upload(fileStr, {
        folder: "temade-ecommerce", // Optional: organize uploads in folders
      })
    })

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises)

    return NextResponse.json({
      urls: results.map(result => result.secure_url),
      success: true,
    })

  } catch (e) {
    console.error("Upload error:", e)
    return NextResponse.json({ 
      error: "Upload failed", 
      details: e instanceof Error ? e.message : "Unknown error" 
    }, { 
      status: 500 
    })
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "10mb", // Increase limit for multiple files
  },
}


