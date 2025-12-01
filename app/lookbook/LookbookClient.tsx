"use client"
import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import LoadingSpinner from "../components/LoadingSpinner"
import LookbookSkeleton from "../components/skeletons/LookbookSkeleton"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export type LookbookSection = {
  material: string
  images: string[]
}

const RETRY_DELAY_BASE = 1000

type LookbookClientProps = {
  initialSections: LookbookSection[]
}

export default function LookbookClient({ initialSections }: LookbookClientProps) {
  const [sections, setSections] = useState<LookbookSection[]>(initialSections)
  const [loading, setLoading] = useState(initialSections.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768)
    updateMobile()
    window.addEventListener("resize", updateMobile)
    return () => window.removeEventListener("resize", updateMobile)
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchWithRetry = async () => {
      setError(null)
      let attempt = 0
      while (!cancelled) {
        try {
          const res = await fetch("/api/lookbook", { cache: "no-store" })
          if (!res.ok) throw new Error("Failed to load lookbook")
          const data = await res.json()
          const remoteSections: LookbookSection[] = Array.isArray(data.sections)
            ? data.sections.map((section: LookbookSection) => ({
                material: section.material,
                images: Array.isArray(section.images) ? section.images : [],
              }))
            : []

          if (remoteSections.length > 0) {
            if (!cancelled) {
              setSections(remoteSections)
              setError(null)
              setLoading(false)
            }
            return
          }
        } catch {
          if (!cancelled) {
            setError("Still fetching Temade Studios lookbook, please hold on...")
          }
        }
        attempt += 1
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(5000, RETRY_DELAY_BASE * attempt)),
        )
      }
    }

    if (initialSections.length === 0) {
      fetchWithRetry()
    } else {
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [initialSections.length])

  useEffect(() => {
    if (viewerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [viewerOpen])

  useEffect(() => {
    if (viewerOpen && isMobile && scrollContainerRef.current) {
      const target = scrollContainerRef.current.children[activeImageIndex] as HTMLElement | undefined
      target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }
  }, [activeImageIndex, isMobile, viewerOpen])

  const openViewer = (sectionIndex: number, imageIndex: number) => {
    setActiveSection(sectionIndex)
    setActiveImageIndex(imageIndex)
    setViewerOpen(true)
  }

  const closeViewer = () => setViewerOpen(false)

  const goPrev = () => {
    const total = sections[activeSection]?.images.length || 0
    if (total === 0) return
    setActiveImageIndex((prev) => (prev - 1 + total) % total)
  }

  const goNext = () => {
    const total = sections[activeSection]?.images.length || 0
    if (total === 0) return
    setActiveImageIndex((prev) => (prev + 1) % total)
  }

  if (loading) {
    return (
      <div className="py-10">
        <LoadingSpinner label="Curating latest looks..." block className="mb-8 justify-center" />
        <LookbookSkeleton />
      </div>
    )
  }

  if (!sections.length) {
    return (
      <div className="py-20 text-center space-y-4 font-WorkSans">
        <p className="text-2xl text-[#8D2741] font-semibold">Lookbook Coming Soon</p>
        <p className="text-sm text-[#5A554C] max-w-xl mx-auto">
          We&apos;re still pulling the latest looks from Cloudinary. Please check back shortly or refresh to see newly added pieces.
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  const activeImages = sections[activeSection]?.images || []

  return (
    <div className="py-10 space-y-10">
      {sections.map((section, sectionIdx) => (
        <section key={section.material} className="space-y-6 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[75px] font-medium text-[#8D2741] font-sans text-center leading-tight">
            {section.material}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.images.map((img, index) => (
              <button
                key={`${section.material}-${index}`}
                type="button"
                className="relative w-full min-h-[320px] md:min-h-[420px] overflow-hidden rounded-2xl shadow-lg group focus:outline-none"
                onClick={() => openViewer(sectionIdx, index)}
              >
                <Image
                  src={img}
                  alt={`${section.material} outfit ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </section>
      ))}

      {viewerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeViewer}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {isMobile ? (
            <div
              ref={scrollContainerRef}
              className="flex gap-4 w-full h-full overflow-x-auto snap-x snap-mandatory"
            >
              {activeImages.map((src, idx) => (
                <div
                  key={`mobile-view-${idx}`}
                  className="relative min-w-full h-full snap-center flex-shrink-0"
                >
                  <Image
                    src={src}
                    alt={`Lookbook detail ${idx + 1}`}
                    fill
                    className="object-cover rounded-2xl"
                    sizes="100vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
              <Image
                src={activeImages[activeImageIndex]}
                alt="Lookbook detail"
                fill
                className="object-cover rounded-3xl"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3"
                aria-label="Previous look"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3"
                aria-label="Next look"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

