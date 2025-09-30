"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/app/context/AuthContext"
import { baseCategoryImages, type CategoryImage } from "@/app/data/shopCategories"

export default function InventoryManagerPage() {
  const { user, isLoading } = useAuth()

  const isAdmin = useMemo(() => {
    if (!user?.email) return false
    const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    return allow.includes(user.email.toLowerCase())
  }, [user?.email])

  if (isLoading) return <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">Loading...</div>
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center gap-3">
        <p className="text-lg">Access denied</p>
        <Link href="/" className="text-[#CA6F86] underline">Go home</Link>
      </div>
    )
  }

  const categories = Object.keys(baseCategoryImages)

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#16161A]">Inventory</h1>
        <Link href="/admin" className="underline text-[#2C2C2C]">Back to Analytics</Link>
      </div>

      <p className="text-sm text-gray-600 mb-4">This view mirrors the shop catalog for quick review. To change prices per currency, edit the product in <code>app/data/shopCategories.tsx</code> (fields: <code>price</code>, <code>priceUSD</code>, <code>priceGBP</code>).</p>

      {categories.map((cat) => (
        <section key={cat} className="mb-10">
          <h2 className="text-xl font-semibold mb-3">{cat}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {baseCategoryImages[cat]?.map((item: CategoryImage) => {
              const first = item.colorVariants[0]?.images[0]
              return (
                <div key={item.id} className="bg-white rounded-xl shadow p-4 flex gap-3 items-center">
                  <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100">
                    {first && <Image src={first.src} alt={first.alt} fill className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">NGN: {item.price?.toLocaleString?.() ?? item.price}</p>
                    {item.priceUSD != null && <p className="text-sm text-gray-600">USD: {item.priceUSD.toLocaleString()}</p>}
                    {item.priceGBP != null && <p className="text-sm text-gray-600">GBP: {item.priceGBP.toLocaleString()}</p>}
                    <p className="text-xs text-gray-500 mt-1">ID: {item.id}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}


