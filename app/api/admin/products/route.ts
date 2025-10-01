import { NextResponse } from "next/server"
import { ProductService } from "@/lib/services/productService"

export async function GET() {
  const items = await ProductService.list()
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const body = await request.json()
  const created = await ProductService.create(body)
  return NextResponse.json(created, { status: 201 })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  const ok = await ProductService.update(id, updates)
  return NextResponse.json({ ok })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const ok = await ProductService.remove(id)
  return NextResponse.json({ ok })
}



