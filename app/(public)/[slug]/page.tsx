import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getDatabase } from "@/lib/mongodb"

type PageDoc = {
  _id: string
  title: string
  slug: string
  status: "draft" | "published"
  excerpt?: string
  content?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
    ogImage?: string
    schemaJsonLd?: string
  }
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

async function getPage(slug: string): Promise<PageDoc | null> {
  const db = await getDatabase()
  const page = await db.collection<PageDoc>("pages").findOne({ slug, status: "published" })
  return page || null
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}

  const baseUrl = getBaseUrl()
  const canonical = page.seo?.canonicalUrl || `${baseUrl}/${page.slug}`
  const title = page.seo?.metaTitle || page.title
  const description = page.seo?.metaDescription || page.excerpt || ""
  const ogImage = page.seo?.ogImage

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : [],
      type: "article",
    },
  }
}

export default async function PublicCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  const rawContent = page.content || ""
  const htmlContent = rawContent.includes("<")
    ? rawContent
    : rawContent.replace(/\n/g, "<br />")

  return (
    <main className="px-4 py-10 md:py-16 max-w-3xl mx-auto font-WorkSans">
      <h1 className="text-3xl md:text-4xl font-bold text-[#16161A] mb-4">{page.title}</h1>
      {page.excerpt && <p className="text-lg text-gray-700 mb-6">{page.excerpt}</p>}
      <div
        className="prose max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {page.seo?.schemaJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: page.seo.schemaJsonLd }}
        />
      )}
    </main>
  )
}
