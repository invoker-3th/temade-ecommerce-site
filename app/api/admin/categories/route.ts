import { NextResponse } from "next/server"
import { CategoryService } from "@/lib/services/categoryService"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

export async function GET(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:view")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const items = await CategoryService.list()
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const created = await CategoryService.create(body)
  return NextResponse.json({ item: created }, { status: 201 })
}

export async function PUT(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const { id, ...updates } = body
  const ok = await CategoryService.update(id, updates)
  return NextResponse.json({ ok })
}

export async function DELETE(request: Request) {
  const perm = await requirePermissionFromRequest(request, "catalog:edit")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const ok = await CategoryService.remove(id)
  return NextResponse.json({ ok })
}



