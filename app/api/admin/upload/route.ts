import { NextResponse } from "next/server"
import { createWriteStream } from "fs"
import { mkdir, stat } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as unknown as File
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 })

  const buffers: Uint8Array[] = []
  const stream = file.stream() as unknown as ReadableStream<Uint8Array>
  const reader = stream.getReader()
  let res: ReadableStreamReadResult<Uint8Array>
  while ((res = await reader.read()).done === false) {
    buffers.push(res.value as Uint8Array)
  }

  const bytes = Buffer.concat(buffers)
  const uploadDir = join(process.cwd(), "public", "uploads")
  try {
    await stat(uploadDir)
  } catch {
    await mkdir(uploadDir, { recursive: true })
  }
  const filename = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, "-")
  const filepath = join(uploadDir, filename)
  await new Promise<void>((resolve, reject) => {
    const ws = createWriteStream(filepath)
    ws.on("error", reject)
    ws.on("finish", () => resolve())
    ws.write(bytes)
    ws.end()
  })

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 })
}


