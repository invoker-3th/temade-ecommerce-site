"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { useCurrency } from "../context/CurrencyContext"
import TrackOrderModal from "./TrackOrderModal"
import type { Order } from "../../lib/models/User"
import { normalizeSize } from "@/lib/utils"

export default function OrdersTab() {
  const { user } = useAuth()
  const { symbol } = useCurrency()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackOrderModal, setTrackOrderModal] = useState<{
    isOpen: boolean
    orderId: string
    orderStatus: string
    paymentStatus: string
  }>({
    isOpen: false,
    orderId: '',
    orderStatus: '',
    paymentStatus: ''
  })

  const fetchOrders = useCallback(async (isRefresh = false) => {
      try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
        setError(null)

        if (!user?._id) {
          setOrders([])
          return
        }

        const res = await fetch(`/api/orders?userId=${encodeURIComponent(user._id.toString())}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          const errorText = await res.text()
          console.error("Failed to fetch orders:", res.status, errorText)
          throw new Error(`Failed to fetch orders: ${res.status}`)
        }

        const data = await res.json()
        setOrders(data.orders || [])
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Something went wrong")
        }
      } finally {
        setLoading(false)
      setRefreshing(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchOrders()
    // Remove constant polling - only refresh on mount and manual refresh
  }, [fetchOrders])

  const handleRefresh = () => {
    fetchOrders(true)
  }

  const handleTrackOrder = (order: Order) => {
    setTrackOrderModal({
      isOpen: true,
      orderId: order._id?.toString() || '',
      orderStatus: order.orderStatus || 'pending',
      paymentStatus: order.paymentStatus || 'pending'
    })
  }

  const closeTrackOrderModal = () => {
    setTrackOrderModal({
      isOpen: false,
      orderId: '',
      orderStatus: '',
      paymentStatus: ''
    })
  }

  const getStatusColor = (status: string, type: 'payment' | 'order') => {
    if (type === 'payment') {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800'
        case 'failed': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
          } else {
      switch (status) {
        case 'processing': return 'bg-yellow-100 text-yellow-800'
        case 'shipped': return 'bg-blue-100 text-blue-800'
        case 'delivered': return 'bg-green-100 text-green-800'
        case 'cancelled': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }
  }

  const getStatusText = (status: string, type: 'payment' | 'order') => {
    if (type === 'payment') {
      switch (status) {
        case 'completed': return 'Paid'
        case 'failed': return 'Failed'
        default: return 'Pending'
      }
    } else {
      switch (status) {
        case 'processing': return 'Processing'
        case 'shipped': return 'Shipped'
        case 'delivered': return 'Delivered'
        case 'cancelled': return 'Cancelled'
        default: return 'Pending'
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D2741] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#8D2741] text-white rounded hover:bg-[#701d34]"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="font-WorkSans">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Your Orders</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-[#8D2741] text-white rounded text-sm hover:bg-[#701d34] disabled:opacity-50 flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl p-8 text-center bg-gray-50">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg mb-4">You don&apos;t have any orders yet</p>
          <Link 
            href="/shop" 
            className="inline-block px-6 py-3 bg-[#8D2741] text-white rounded-lg hover:bg-[#701d34] transition-colors"
          >
            Start Shopping
            </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id?.toString()} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Order #{order.invoice?.number || order._id?.toString()}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {symbol}{order.total?.toLocaleString() || '0'}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus || 'pending', 'payment')}`}>
                        {getStatusText(order.paymentStatus || 'pending', 'payment')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus || 'pending', 'order')}`}>
                        {getStatusText(order.orderStatus || 'pending', 'order')}
                    </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4">
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <img
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-800 truncate">{item.name}</h5>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>Qty: {item.quantity}</span>
                          {item.color && (
                            <span className="flex items-center gap-1">
                              Color: 
                              <span 
                                className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                                style={{ backgroundColor: item.color.toLowerCase() }}
                                title={item.color}
                              ></span>
                              {item.color}
                    </span>
                          )}
                          {item.size && <span>Size: {normalizeSize(item.size)}</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {symbol}{item.price?.toLocaleString() || '0'} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          {symbol}{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    <p>Items: {order.items?.length || 0}</p>
                    {order.shippingAddress && (
                      <p>Ship to: {order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/shop/${order.items?.[0]?.id || ''}`}
                      className="px-4 py-2 text-sm text-[#8D2741] border border-[#8D2741] rounded hover:bg-[#8D2741] hover:text-white transition-colors"
                    >
                      View Product
                    </Link>
                    <button 
                      onClick={() => handleTrackOrder(order)}
                      className="px-4 py-2 text-sm bg-[#8D2741] text-white rounded hover:bg-[#701d34] transition-colors"
                    >
                      Track Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Track Order Modal */}
      <TrackOrderModal
        isOpen={trackOrderModal.isOpen}
        onClose={closeTrackOrderModal}
        orderId={trackOrderModal.orderId}
        orderStatus={trackOrderModal.orderStatus}
        paymentStatus={trackOrderModal.paymentStatus}
      />
    </div>
  )
}
