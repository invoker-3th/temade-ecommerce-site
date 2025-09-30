"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

interface CheckoutOverlayProps {
  visible: boolean
  onClose: () => void
}

export default function CheckoutOverlay({ visible, onClose }: CheckoutOverlayProps) {
  const router = useRouter()

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md mx-auto">
        <Image src="/checkout.jpg" alt="Order Placed" width={130} height={130} className="block m-auto"/>
        <p className="text-[18px] font-normal text-[#464646] mb-4">Order Placed! has been placed. <br /> <span className="font-semibold">Temade</span> Goodness is on the way to you
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              onClose()
              router.push("/account")
            }}
            className="bg-[#8D2741] text-white px-6 py-2 rounded-lg hover:bg-[#111]"
          >
            VIEW ORDERS
          </button>
        </div>
      </div>
    </div>
  )
}
