import type { MetadataRoute } from "next"
import { getDatabase } from "@/lib/mongodb"

type PageDoc = {
  slug: string
  status: "draft" | "published"
  updatedAt?: Date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const staticRoutes = [
    "",
    "/shop",
    "/collections",
    "/account",
    "/auth/login",
    "/auth/register",
  ]

  const now = new Date()
  let cmsRoutes: MetadataRoute.Sitemap = []
  try {
    const db = await getDatabase()
    const pages = await db
      .collection<PageDoc>("pages")
      .find({ status: "published" }, { projection: { slug: 1, updatedAt: 1 } })
      .toArray()

    cmsRoutes = pages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt || now,
    }))
  } catch {
    cmsRoutes = []
  }

  const staticEntries = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
  }))

  return [...staticEntries, ...cmsRoutes]
}
