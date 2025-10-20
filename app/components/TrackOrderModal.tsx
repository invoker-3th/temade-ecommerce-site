"use client"

import { useState, useEffect } from "react"
import { X, Package, Truck, CheckCircle, Clock } from "lucide-react"

interface TrackOrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderStatus: string
  paymentStatus: string
}

export default function TrackOrderModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderStatus, 
  paymentStatus 
}: TrackOrderModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

  if (!isVisible) return null

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'processing':
        return {
          icon: <Package className="w-6 h-6" />,
          title: 'Processing',
          description: 'Your order is being prepared',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200'
        }
      case 'shipped':
        return {
          icon: <Truck className="w-6 h-6" />,
          title: 'Shipped',
          description: 'Your order is on the way',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200'
        }
      case 'delivered':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          title: 'Delivered',
          description: 'Your order has been delivered',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200'
        }
      case 'cancelled':
        return {
          icon: <X className="w-6 h-6" />,
          title: 'Cancelled',
          description: 'Your order has been cancelled',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200'
        }
      default:
        return {
          icon: <Clock className="w-6 h-6" />,
          title: 'Pending',
          description: 'Your order is being processed',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200'
        }
    }
  }

  const getPaymentStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          title: 'Paid',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'failed':
        return {
          icon: <X className="w-5 h-5" />,
          title: 'Payment Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          title: 'Pending Payment',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        }
    }
  }

  const statusInfo = getStatusInfo(orderStatus)
  const paymentInfo = getPaymentStatusInfo(paymentStatus)

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform ${isOpen ? 'scale-100' : 'scale-95'} transition-transform duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 font-WorkSans">
            Track Order #{orderId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${paymentInfo.bgColor}`}>
                <div className={paymentInfo.color}>
                  {paymentInfo.icon}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-800">Payment Status</p>
                <p className={`text-sm ${paymentInfo.color}`}>{paymentInfo.title}</p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className={`p-4 rounded-lg border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
                <div className={statusInfo.color}>
                  {statusInfo.icon}
                </div>
              </div>
              <div>
                <h3 className={`font-semibold text-lg ${statusInfo.color}`}>
                  {statusInfo.title}
                </h3>
                <p className="text-gray-600">{statusInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Order Progress</h4>
            <div className="space-y-3">
              {/* Processing Step */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                orderStatus === 'processing' || orderStatus === 'shipped' || orderStatus === 'delivered' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  orderStatus === 'processing' || orderStatus === 'shipped' || orderStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">Order Processing</p>
                  <p className="text-xs text-gray-500">Preparing your order</p>
                </div>
              </div>

              {/* Shipped Step */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                orderStatus === 'shipped' || orderStatus === 'delivered'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  orderStatus === 'shipped' || orderStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">Shipped</p>
                  <p className="text-xs text-gray-500">Order is on the way</p>
                </div>
              </div>

              {/* Delivered Step */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                orderStatus === 'delivered'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  orderStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">Delivered</p>
                  <p className="text-xs text-gray-500">Order delivered successfully</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Need Help?</h4>
            <p className="text-sm text-blue-700">
              If you have any questions about your order, please contact our support team.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
