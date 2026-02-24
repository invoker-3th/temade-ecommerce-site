"use client"

import React from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Button } from '@/app/components/ui/button'
import { motion } from 'framer-motion'

interface SizeGuideModalProps {
  open: boolean
  onClose: () => void
}

export default function SizeGuideModal({ open, onClose }: SizeGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
          <motion.div
          key="size-guide-modal"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full max-w-5xl sm:rounded-2xl bg-[#FFFBEB] shadow-xl overflow-hidden font-WorkSans max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-center">SIZE GUIDE</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[80vh] p-4 text-sm text-gray-700 dark:text-gray-300 space-y-4 font-WorkSans scrollbar-thin scrollbar-thumb-[#8D2741] scrollbar-track-[#FFD7E1] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8D2741] [&::-webkit-scrollbar-track]:bg-[#FFD7E1] [&::-webkit-scrollbar]:w-2 overflow-auto">
            <div className="w-full flex justify-center items-start py-2">
              <div className="w-full max-w-[1200px]">
                <div className="w-full bg-white rounded overflow-hidden">
                  <Image
                    src="/temade-size-guide.jpeg"
                    alt="Size guide"
                    width={1200}
                    height={1500}
                    priority
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
            <Button onClick={onClose} className="bg-[#8D2741] hover:bg-[#551827] text-white px-6 rounded">
              Close
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
