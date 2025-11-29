'use client'

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { EB_Garamond } from "next/font/google"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { motion } from 'framer-motion'

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["500"],
})

type CollectionConfig = {
  slug: string
  title: string
  description?: string | null
  images: Array<{ src: string; alt: string }>
  downloadUrl?: string
  shopUrl?: string
}

const collections: CollectionConfig[] = [
  {
    slug: "burst",
    title: "Burst Collection",
    description: `As the bubbles rise, one by one they burst. Not in loss, but in liberation.
Instant joy refuses to be contained; it is energy mid-flight, beauty in motion, a celebration of what happens when you stop holding back.

This is the femininity that is bold, the laughter that echoes, the dresses that flare without apology and fabrics that demand to be felt. Where colors drift and captivate like bubbles dancing in the sunlight - soft lavender haze, warm buttery yellow, deep rose hue.

Burst is the exhale after holding your breath. It is joy - raw, radiant, uncontainable. Bursting forth into everything you are and everything you're becoming.`,
    images: [
      { src: "/burst1.jpg", alt: "Burst collection look 1" },
      { src: "/burst2.jpg", alt: "Burst collection look 2" },
      { src: "/burst3.jpg", alt: "Burst collection look 3" },
    ],
    shopUrl: "/shop",
  },
  {
    slug: "wholeness",
    title: "Wholeness Collection",
    description: null,
    images: [
      { src: "/wholeness1.jpg", alt: "Wholeness collection look 1" },
      { src: "/wholeness2.jpg", alt: "Wholeness collection look 2" },
      { src: "/wholeness3.jpg", alt: "Wholeness collection look 3" },
    ],
    downloadUrl: "/uploads/TemADE-Collection-1-Lookbook.pdf",
  },
]

export default function CollectionsPage() {
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/uploads/TemADE-Collection-1-Lookbook.pdf'
    link.download = 'TemADE-Collection-1-Lookbook.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowDownloadModal(false)
  }

  return (
    <>
      <div className="bg-[#FFFBEB] text-[#1C1A17] min-h-screen font-WorkSans">
        <header className="max-w-5xl mx-auto px-6 py-16 text-center space-y-4">
          <p className="text-sm tracking-[0.4em] text-[#8D2741] uppercase">Current Collections</p>
          <h1 className="text-4xl md:text-6xl font-semibold">TEMADE Studios Capsules</h1>
          <p className="text-base md:text-lg text-[#5A554C]">
            A living archive of our seasonal drops. Each capsule blends artisanal techniques with timeless silhouettes so every
            piece feels collected, not just purchased.
          </p>
        </header>

        <main className="max-w-6xl mx-auto px-6 pb-24 space-y-24">
          {collections.map((collection) => (
            <section key={collection.slug} className="space-y-8" id={collection.slug}>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-[#8D2741] mb-2">Collection</p>
                <h2 className={`${ebGaramond.className} text-[70px] font-medium leading-[100%] tracking-[0%]`}>
                  {collection.title}
                </h2>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {collection.images.map((img, index) => (
                <div
                  key={`${collection.slug}-${index}`}
                  className="relative w-full aspect-[407/568] overflow-hidden rounded-2xl shadow-lg bg-white"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    priority={(collection.slug === "burst" || collection.slug === "wholeness") && index === 0}
                  />
                </div>
              ))}
            </div>

            <div className="max-w-4xl mx-auto text-center text-base leading-relaxed text-[#403A32] whitespace-pre-line">
              {collection.description ? (
                collection.description
              ) : (
                <span className="italic text-[#8D2741]">Narrative coming soon. Stay tuned for the full Wholeness story.</span>
              )}
            </div>

            <div className="flex justify-center">
              {collection.shopUrl ? (
                <Link
                  href={collection.shopUrl}
                  className="inline-flex items-center gap-2 bg-[#8D2741] text-white px-5 py-3 rounded-full text-sm font-medium transition hover:bg-[#701d34]"
                >
                  SHOP BURST COLLECTION
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : collection.downloadUrl ? (
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="inline-flex items-center gap-2 bg-[#8D2741] text-white px-5 py-3 rounded-full text-sm font-medium transition hover:bg-[#701d34]"
                >
                  DOWNLOAD WHOLENESS LOOKBOOK
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : null}
            </div>
          </section>
        ))}
      </main>
      </div>

      {/* Download Confirmation Modal */}
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent
          className="flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setShowDownloadModal(false)}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-md sm:rounded-2xl bg-[#FFFBEB] shadow-xl overflow-hidden font-WorkSans"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader className="p-4 border-b border-gray-200">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-center text-[#5A554C]">
                Download Confirmation
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 text-center space-y-4">
              <p className="text-base text-[#403A32]">
                Do you want to download TemADE Wholeness Collection?
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleDownload}
                  className="bg-[#8D2741] hover:bg-[#701d34] text-white px-6 rounded"
                >
                  Download
                </Button>
                <Button
                  onClick={() => setShowDownloadModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-[#403A32] px-6 rounded"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  )
}

