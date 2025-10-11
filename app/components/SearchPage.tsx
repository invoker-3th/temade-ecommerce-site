"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"

type Product = {
  _id: string
  name: string
  priceNGN: number
  colorVariants?: Array<{ images: Array<{ src: string; alt: string }> }>
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // Read query from URL
  useEffect(() => {
    const q = (searchParams.get("q") || "").trim()
    if (q && q !== query) {
      setQuery(q)
      setSearchInput(q)
    }
  }, [searchParams, query])

  // Fetch products based on query
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Search failed")
        const data = await res.json()
        setResults(data.results || [])
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError"))
          setError("Search failed")
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => controller.abort()
  }, [query])

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    setQuery(searchInput.trim())
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] font-WorkSans relative">
      {/* 🔍 Fixed Search Bar on Mobile */}
      <div className="sticky top-0 left-0 right-0 z-20 bg-[#FFFBEB]/95 backdrop-blur-md shadow-sm px-4 py-3 md:static md:shadow-none md:py-0 md:px-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-white shadow-sm rounded-full px-4 py-2 md:mt-10"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 bg-transparent outline-none text-gray-800 text-sm md:text-base"
            />
            <button
              type="submit"
              className="bg-[#8D2741] text-white px-4 py-1.5 text-sm rounded-full hover:bg-[#a23a55] transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 🛍️ Search Results Section */}
      <div className="max-w-3xl mx-auto p-4 md:p-10">
        {query ? (
          <>
            {/* Desktop Title */}
            <h1 className="hidden md:block text-2xl md:text-3xl font-bold mb-4">
              Search Results{query ? ` for: ${query}` : ""}
            </h1>

            {/* Loading Animation */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-gray-600"
                >
                  <span className="w-4 h-4 border-2 border-[#8D2741] border-t-transparent rounded-full animate-spin inline-block" />
                  Loading results...
                </motion.div>
              )}
            </AnimatePresence>

            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

            {/* 🧩 Product Grid */}
            <div
              className={`grid gap-4 mt-4 ${isMobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                }`}
            >
              <AnimatePresence>
                {results.length === 0 && !loading && (
                  <div className="text-gray-500 text-center w-full py-6 col-span-full">
                    No products found for “{query}”
                  </div>
                )}
                {results.map((p) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={`/shop/${p._id}`}
                      className="bg-white rounded-xl shadow p-3 hover:shadow-md transition block"
                    >
                      <div className="w-full h-40 bg-gray-100 rounded mb-2 overflow-hidden">
                        <Image
                          src={p.colorVariants?.[0]?.images?.[0]?.src || "/placeholder.svg"}
                          alt={p.name}
                          width={0}
                          height={0}
                          sizes="100vw"
                          className="w-full h-full object-cover"
                          priority
                        />
                      </div>
                      <div className="text-sm text-gray-600 truncate">{p.name}</div>
                      <div className="font-semibold text-[#8D2741]">
                        ₦{p.priceNGN?.toLocaleString?.() || 0}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          // ✨ Message when no query (mobile only)
          <div className="text-center text-gray-500 mt-24 md:hidden">
            Start typing above to search for products 🔍
          </div>
        )}
      </div>
    </div>
  )
}
