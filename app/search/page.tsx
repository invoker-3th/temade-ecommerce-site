"use client"

import { Suspense } from "react"
import { motion } from "framer-motion"
import SearchPage from "@/app/components/SearchPage"

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFBEB] text-gray-700 font-WorkSans">
      <motion.div
        className="w-10 h-10 border-4 border-[#8D2741] border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <motion.p
        className="mt-4 text-lg font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
      >
        Loading search results...
      </motion.p>
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
