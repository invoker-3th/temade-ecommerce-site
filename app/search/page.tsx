"use client"

import { Suspense } from "react"
import SearchPage from "@/app/components/SearchPage"
import LoadingSpinner from "@/app/components/LoadingSpinner"
import SearchResultsSkeleton from "@/app/components/skeletons/SearchResultsSkeleton"

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFBEB] text-gray-700 font-WorkSans p-6">
      <LoadingSpinner label="Loading search results..." block className="justify-center" />
      <div className="w-full max-w-3xl mt-10">
        <SearchResultsSkeleton />
      </div>
    </div>
  )
}

export default function Search() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SearchPage />
    </Suspense>
  )
}
