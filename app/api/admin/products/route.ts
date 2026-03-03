import { NextResponse } from "next/server"
import { ProductService } from "@/lib/services/productService"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function GET(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const items = await ProductService.list()
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const created = await ProductService.create(body)
  return NextResponse.json(created, { status: 201 })
}

export async function PUT(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const { id, ...updates } = body
  const ok = await ProductService.update(id, updates)
  return NextResponse.json({ ok })
}

export async function DELETE(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const ok = await ProductService.remove(id)
  return NextResponse.json({ ok })
}



