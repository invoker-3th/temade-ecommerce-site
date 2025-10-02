"use client"

import { usePaystackPayment } from "react-paystack"
import { type PaystackProps } from "react-paystack/dist/types"

interface Props {
  config: PaystackProps
  onSuccess: (reference: { reference: string }) => void
  onClose: () => void
  disabled: boolean
  isProcessing: boolean
}

export default function PaystackCheckout({ config, onSuccess, onClose, disabled, isProcessing }: Props) {
  const initializePayment = usePaystackPayment(config)

  return (
    <button
      type="submit"
      form="checkout-form"
      disabled={disabled}
      onClick={() => initializePayment({ onSuccess, onClose })}
      className="w-full bg-[#8D2741] text-white py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 hover:bg-[#701d34] disabled:hover:bg-[#8D2741]"
    >
      {isProcessing ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Processing Payment...
        </div>
      ) : (
        `Pay with Paystack`
      )}
    </button>
  )
}