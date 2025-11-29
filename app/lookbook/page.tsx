import LookbookClient, { LookbookSection } from "./LookbookClient"
import { LookbookService } from "@/lib/services/lookbookService"

export const dynamic = "force-dynamic"

export default async function LookbookPage() {
  let initialSections: LookbookSection[] = []
  try {
    const sections = await LookbookService.list()
    initialSections = sections.map((section) => ({
      material: section.material,
      images: Array.isArray(section.images) ? section.images : [],
    }))
  } catch {
    initialSections = []
  }

  return <LookbookClient initialSections={initialSections} />
}
