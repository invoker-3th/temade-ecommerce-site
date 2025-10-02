"use client"

import { ChevronDown, Heart, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { baseCategoryImages, CategoryImage } from "../../../data/shopCategories"
import { useCart } from "../../../context/CartContext"
import { useWishlist } from "../../../context/WishlistContext"
import { notFound } from "next/navigation"

type ToastType = "success" | "error"

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
}

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
  colorVariants: Array<{ colorName: string; images: Array<{ src: string; alt: string }> }>
}

function CategoryPage({ params }: CategoryPageProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({})
  const [selectedColors, setSelectedColors] = useState<{ [key: string]: string }>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>("success")
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [category, setCategory] = useState<string>("")
  const [categoryItems, setCategoryItems] = useState<CategoryImage[]>([])
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([])

  useEffect(() => {
    const loadCategory = async () => {
      const resolvedParams = await params
      const categoryName = resolvedParams.category.toUpperCase()
      setCategory(categoryName)
      const items = baseCategoryImages[categoryName as keyof typeof baseCategoryImages]
      if (!items) {
        notFound()
      }
      setCategoryItems(items)
    }
    loadCategory()
  }, [params])

  useEffect(() => {
    const loadDb = async () => {
      try {
        const res = await fetch("/api/admin/products", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const items: DbProduct[] = Array.isArray(data) ? data : (data.items || [])
          setDbProducts(items.filter((p) => p.category?.toUpperCase() === category))
        }
      } catch {}
    }
    if (category) loadDb()
  }, [category])

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Show loading state while category is being loaded
  if (!category || categoryItems.length === 0) {
    return (
      <div className="max-w-[1280px] m-auto px-8 py-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  const handleAddToCart = (item: CategoryImage) => {
    const selectedSize = selectedSizes[item.id]
    const selectedColor = selectedColors[item.id]
    const firstImage = item.colorVariants[0]?.images[0]

    if (!selectedSize && item.sizes && item.sizes.length > 0) {
      setToastType("error")
      setToastMessage("Please select a size first")
      return
    }
    if (!selectedColor && item.colorVariants && item.colorVariants.length > 0) {
      setToastType("error")
      setToastMessage("Please select a color first")
      return
    }

    addToCart({
      id: item.id.toString(),
      name: item.name,
      image: firstImage?.src || "",
      price: item.price || 0,
      quantity: 1,
      size: selectedSize || "Default",
      color: selectedColor || "Default",
    })

    setToastType("success")
    setToastMessage(`Added ${item.name} to cart`)
  }

  const toggleWishlist = (item: CategoryImage) => {
    const firstImage = item.colorVariants[0]?.images[0]
    const exists = wishlist.some((w) => w.id === item.id.toString())

    if (exists) {
      removeFromWishlist(item.id.toString())
      setToastType("error")
      setToastMessage(`${item.name} removed from wishlist`)
    } else {
      addToWishlist({
        id: item.id.toString(),
        name: item.name,
        image: firstImage?.src || "",
        price: item.price || 0,
      })
      setToastType("success")
      setToastMessage(`${item.name} added to wishlist`)
    }
  }

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

  const categories = ["ALL", "TOPS", "SKIRTS", "PANTS", "DRESSES", "JACKETS"]

  return (
    <div className="max-w-[1280px] m-auto px-8 py-4">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-[40px] md:text-[120px] font-medium text-[#16161A] font-sans">SHOP TEMADE</h1>
        {/* Breadcrumb */}
        <div className="font-WorkSans flex space-x-1">
          <Link href="/" className="text-[16px] font-normal text-[#CA6F86]">
            Home
          </Link>
          <h2>/</h2>
          <Link href="/shop" className="text-[16px] font-normal text-[#CA6F86]">
            Shop
          </Link>
          <h2>/</h2>
          <h2 className="text-[16px] font-normal text-[#838383]">{category}</h2>
        </div>
      </div>

      {/* Header with category navigation */}
      <div className="flex items-center justify-between my-4">
        <ul className="flex gap-2">
          {categories.map((cat) => (
            <li key={cat} className="inline-block">
              <Link
                href={cat === "ALL" ? "/shop" : `/shop/categories/${cat.toLowerCase()}`}
                className={`font-normal font-WorkSans transition-colors md:text-[16px] text-[10px] ${
                  cat === category ? "text-black" : "text-gray-500"
                }`}
              >
                {cat}
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
        <h2 className="text-2xl md:text-4xl font-medium text-[#16161A] font-sans">{category}</h2>
        <p className="text-gray-600 mt-2">{dbProducts.length} items</p>
      </div>

      {/* Products grid (DB only) */}
      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-6">
        {/* DB products */}
        {dbProducts.map((p) => {
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
                <Link href={`/shop/${p.sku || p._id}`} className="block relative aspect-[2/3]">
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
                <h3 className="text-[16px] font-sans font-normal text-[#2C2C2C]">{p.name}</h3>
                <p className="text-lg font-medium text-[#2C2C2C] font-sans">₦{(p.priceNGN ?? 0).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => {
                    const first = p.colorVariants[0]?.images[0]
                    addToCart({ id: p._id, name: p.name, image: first?.src || "", price: p.priceNGN ?? 0, quantity: 1, size: "Default", color: p.colorVariants[0]?.colorName || "Default" })
                    setToastType("success")
                    setToastMessage(`Added ${p.name} to cart`)
                  }}
                  className="underline font-semibold text-[16px] font-sans text-[#2C2C2C] hover:text-[#701d34] transition-colors"
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

export default CategoryPage
