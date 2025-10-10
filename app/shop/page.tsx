"use client"

import { ChevronDown, Heart, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
// Removed static data imports - using only admin-created data
import { useCart } from "../context/CartContext"
import { useWishlist } from "../context/WishlistContext"
import { useCategories } from "../hooks/useCategories"

type ToastType = "success" | "error"

type DbProduct = {
  _id: string
  name: string
  sku: string
  description: string
  category: string
  priceNGN: number
  priceUSD?: number
  priceGBP?: number
  sizes: string[]
  colorVariants: Array<{ 
    colorName: string
    hexCode: string
    images: Array<{ src: string; alt: string }> 
  }>
}

function Shop() {
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([])
  const { categories: mergedCategories } = useCategories({ pollMs: 15000 })
  useEffect(() => {
    const fetchDb = async () => {
      try {
        const res = await fetch("/api/admin/products", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setDbProducts(Array.isArray(data) ? data : (data.items || []))
        }
      } catch {}
    }
    fetchDb()
  }, [])
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  // Removed unused state variables
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>("success")
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])


  function Toast({ message, type }: { message: string; type: ToastType }) {
    return (
      <div
        className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 max-w-xs border shadow-lg rounded-lg px-5 py-3 text-sm font-semibold transition-opacity duration-300
          opacity-100 pointer-events-auto
          ${type === "success" ? "bg-white border-green-400 text-green-700" : "bg-white border-red-400 text-red-600"}
        `}
        role="alert"
      >
        {type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-lg font-bold">!</span>}
        <span>{message}</span>
      </div>
    )
  }

  const categories = useMemo(() => ["ALL", ...mergedCategories], [mergedCategories])

  // Deduplicate products by name using a Map for performance
  const uniqueProducts = useMemo(() => {
    const nameToProduct = new Map<string, DbProduct>()
    for (const p of dbProducts) {
      if (!nameToProduct.has(p.name)) nameToProduct.set(p.name, p)
    }
    return Array.from(nameToProduct.values())
  }, [dbProducts])

  return (
    <div className="max-w-[1280px] m-auto px-8 py-4 font-WorkSans">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-[40px] md:text-[120px] font-medium text-[#16161A]">SHOP TEMADE</h1>
        {/* Breadcrumb */}
        <div className="font-WorkSans flex space-x-1">
          <Link href="/" className="text-[16px] font-normal text-[#CA6F86]">
            Home
          </Link>
          <h2>/</h2>
          <h2 className="text-[16px] font-normal text-[#838383]">Shop</h2>
        </div>
      </div>

      {/* Header with category navigation */}
      <div className="flex items-center justify-between my-4">
        <ul className="flex gap-2">
          {categories.map((category) => (
            <li key={category} className="inline-block">
              <Link
                href={category === "ALL" ? "/shop" : `/shop/categories/${category.toLowerCase()}`}
                className={`font-normal font-WorkSans transition-colors md:text-[16px] text-[10px] ${
                  category === "ALL" ? "text-black" : "text-gray-500"
                }`}
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center">
          <h2 className="font-normal font-WorkSans md:text-[16px] text-[10px]">List</h2>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {/* Category title */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-4xl font-medium text-[#16161A]">ALL PRODUCTS</h2>
        <p className="text-gray-600 mt-2">{uniqueProducts.length} products</p>
      </div>

      {/* All products grid (DB only) - Grouped by name */}
      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-6">
        {/* DB products - Group by name to show only one instance per product */}
        {uniqueProducts.map((p) => {
          const firstImage = p.colorVariants[0]?.images[0]
          return (
            <div
              key={p._id}
              className="flex-[0_0_80%] sm:flex-[0_0_60%] md:flex-[0_0_40%] lg:flex-[0_0_30%] group relative overflow-hidden rounded-md"
              onMouseEnter={() => setHoveredItem(p._id)}
              onMouseLeave={() => setHoveredItem(null)}
              role="listitem"
            >
              <div className="relative aspect-[2/3]">
                <Link href={`/shop/${p._id}`} className="block relative aspect-[2/3]">
                  <Image
                    src={firstImage?.src || "/placeholder.svg"}
                    alt={firstImage?.alt || p.name}
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </Link>
                <button
                  onClick={() => {
                    const first = p.colorVariants[0]?.images[0]
                    const exists = wishlist.some((w) => w.id === (p._id))
                    if (exists) {
                      removeFromWishlist(p._id)
                      setToastType("error")
                      setToastMessage(`${p.name} removed from wishlist`)
                    } else {
                      addToWishlist({ id: p._id, name: p.name, image: first?.src || "", price: p.priceNGN || 0 })
                      setToastType("success")
                      setToastMessage(`${p.name} added to wishlist`)
                    }
                  }}
                  aria-label="Add to wishlist"
                  className={`absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm transition-opacity ${
                    hoveredItem === p._id ? "opacity-100" : "opacity-0"
                  }`}
                  type="button"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      wishlist.some((w) => w.id === p._id)
                        ? "fill-[#8D2741] text-[#8D2741]"
                        : "text-[#8D2741]"
                    }`}
                  />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-[#FBF7F3CC]/80 backdrop-blur-sm p-2 transition-transform transform group-hover:translate-y-0 translate-y-full">
                <h3 className="text-[16px] font-normal text-[#2C2C2C]">{p.name}</h3>
                
                {/* Available Sizes */}
                {p.sizes && p.sizes.length > 0 && (
                  <div className="mb-1">
                    <p className="text-xs text-gray-600">Sizes: {p.sizes.join(", ")}</p>
                  </div>
                )}
                
                {/* Available Colors with Swatches */}
                {p.colorVariants && p.colorVariants.length > 0 && (
                  <div className="mb-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-gray-600">Colors:</span>
                      {p.colorVariants.map((cv, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: cv.hexCode }}
                          title={cv.colorName}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-lg font-medium text-[#2C2C2C]">₦{(p.priceNGN ?? 0).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => {
                    const first = p.colorVariants[0]?.images[0]
                    addToCart({ 
                      id: p._id, 
                      name: p.name, 
                      image: first?.src || "", 
                      price: p.priceNGN ?? 0, 
                      quantity: 1, 
                      size: p.sizes && p.sizes.length > 0 ? p.sizes[0] : "One Size", 
                      color: p.colorVariants[0]?.colorName || "Default" 
                    })
                    setToastType("success")
                    setToastMessage(`Added ${p.name} to cart`)
                  }}
                  className="underline font-semibold text-[16px] text-[#2C2C2C] hover:text-[#701d34] transition-colors"
                >
                  ADD TO CART
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {toastMessage && <Toast message={toastMessage} type={toastType} />}
    </div>
  )
}

export default Shop