import { NextResponse } from "next/server"
import { LookbookService } from "@/lib/services/lookbookService"

export async function GET() {
  try {
    const sections = await LookbookService.list()
    return NextResponse.json({ sections })
  } catch {
    return NextResponse.json({ error: "Failed to load lookbook" }, { status: 500 })
  }
}

