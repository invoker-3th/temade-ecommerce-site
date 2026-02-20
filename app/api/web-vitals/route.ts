import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

type VitalPayload = {
  id: string
  name: string
  value: number
  delta: number
  rating: string
  navigationType?: string
  url?: string
  path?: string
  userAgent?: string
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as VitalPayload
    if (!payload?.name || typeof payload.value !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const db = await getDatabase()
    await db.collection("web_vitals").insertOne({
      ...payload,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Web vitals POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
