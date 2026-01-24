"use client"

import { usePaystackPayment } from "react-paystack"
import { type PaystackProps } from "react-paystack/dist/types"

interface Props {
  config: PaystackProps
  onSuccess: (reference: { reference: string }) => void
  onClose: () => void
  beforeInit?: () => Promise<boolean> | boolean
  disabled: boolean
  isProcessing: boolean
  isFormValid: boolean
}

export default function PaystackCheckout({ config, onSuccess, onClose, beforeInit, disabled, isProcessing, isFormValid }: Props) {
  const initializePayment = usePaystackPayment(config)

  const getButtonText = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Processing Payment...
        </div>
      )
    }
    
    if (!isFormValid) {
      return "Please fill all required fields to proceed"
    }
    
    return "Pay with Paystack"
  }

  const handleClick = async () => {
    if (disabled) return
    if (beforeInit) {
      try {
        const ok = await beforeInit()
        if (!ok) return
      } catch {
        return
      }
    }
    // Ensure latest orderId is present in metadata (in case it was set during beforeInit)
    try {
      const latestOrderId = typeof window !== 'undefined' ? (sessionStorage.getItem('pendingOrderId') || '') : ''
      if (latestOrderId && config?.metadata) {
        ;(config.metadata as Record<string, unknown>).orderId = latestOrderId
        console.log('Updated Paystack metadata with orderId:', latestOrderId)
      }
    } catch (error) {
      console.error('Error updating Paystack metadata:', error)
    }
    
    try {
      initializePayment({ 
        onSuccess, 
        onClose: () => {
          // Paystack was closed - could be user cancellation or error
          // Errors are typically shown in the Paystack popup itself
          onClose()
        }
      })
    } catch (error) {
      console.error('Error initializing payment:', error)
      let errorMessage = 'Failed to start payment. Please try again.'
      
      if (error instanceof Error) {
        if (error.message?.includes('Currency not supported') || error.message?.includes('currency')) {
          errorMessage = 'The selected currency is not supported. Payments are currently only available in NGN (₦). Please switch to NGN or contact support for assistance.'
        } else if (!error.message?.includes('MetaMask')) {
          // Ignore MetaMask errors as they're unrelated to Paystack
          errorMessage = error.message || errorMessage
        } else {
          // MetaMask error - ignore it
          return
        }
      }
      
      alert(errorMessage)
      onClose()
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className="w-full bg-[#8D2741] text-white py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed font-WorkSans font-semibold transition-all duration-200 hover:bg-[#701d34] disabled:hover:bg-[#8D2741]"
    >
      {getButtonText()}
    </button>
  )
}