import { NextResponse } from "next/server"
import { LookbookService } from "@/lib/services/lookbookService"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "lookbook:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const { material, image } = await request.json()
    if (!material || !image) return NextResponse.json({ error: "material and image required" }, { status: 400 })
    const ok = await LookbookService.addImage(material, image)
    return NextResponse.json({ ok })
  } catch {
    return NextResponse.json({ error: "Failed to add image" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const perm = await requirePermissionFromRequest(request, "lookbook:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const { searchParams } = new URL(request.url)
    const material = searchParams.get("material")
    const image = searchParams.get("image")
    if (!material || !image) return NextResponse.json({ error: "material and image required" }, { status: 400 })
    const ok = await LookbookService.removeImage(material, image)
    return NextResponse.json({ ok })
  } catch {
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}

