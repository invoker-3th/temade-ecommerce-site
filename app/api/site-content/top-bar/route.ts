import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

const COLLECTION = "site_content"
const KEY = "top_bar"
const DEFAULT_MESSAGE = "Shop New Arrivals on TemAde today!"

type TopBarDoc = {
  key: string
  message?: string
}

export async function GET() {
  try {
    const db = await getDatabase()
    const doc = await db.collection<TopBarDoc>(COLLECTION).findOne({ key: KEY })
    const message = String(doc?.message || DEFAULT_MESSAGE).trim() || DEFAULT_MESSAGE
    return NextResponse.json({ message })
  } catch (error) {
    console.error("Public top bar GET error:", error)
    return NextResponse.json({ message: DEFAULT_MESSAGE })
  }
}
