"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"

type Product = {
  _id: string
  name: string
  priceNGN: number
  colorVariants?: Array<{ images: Array<{ src: string; alt: string }> }>
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      try {
        const q = (searchParams.get("q") || "").trim()
        setQuery(q)
        if (!q) {
          setResults([])
          return
        }
        setLoading(true)
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Search failed")
        const data = await res.json()
        setResults(data.results || [])
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setError("Search failed")
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => {
      controller.abort()
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 md:p-10 font-WorkSans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Search Results{query ? ` for: ${query}` : ""}
        </h1>

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

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
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
                  className="bg-white rounded shadow p-3 hover:shadow-md transition block"
                >
                  <div className="w-full h-40 bg-gray-100 rounded mb-2 overflow-hidden">
                    <img
                      src={p.colorVariants?.[0]?.images?.[0]?.src || "/placeholder.svg"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-sm text-gray-600">{p.name}</div>
                  <div className="font-semibold">
                    ₦{p.priceNGN?.toLocaleString?.() || 0}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
