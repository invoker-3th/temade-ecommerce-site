"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Notification = {
  _id: string
  type: "payment_confirmed" | "order_updated" | "new_order" | "new_user"
  title: string
  message: string
  orderId?: string
  userId?: string
  userEmail?: string
  paymentReference?: string
  amount?: number
  read: boolean
  createdAt: string
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  if (loading) return <div>Loading notifications...</div>

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#16161A]">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <button 
          onClick={fetchNotifications}
          className="text-sm text-[#CA6F86] hover:underline"
        >
          Refresh
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No notifications</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-3 rounded-lg border ${
                notification.read 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-[#16161A]">
                    {notification.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  {notification.paymentReference && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ref: {notification.paymentReference}
                    </p>
                  )}
                  {notification.orderId && (
                    <p className="text-xs mt-1">
                      <Link
                        href={`/admin/orders?orderId=${encodeURIComponent(notification.orderId)}`}
                        className="text-[#CA6F86] underline"
                      >
                        Open order
                      </Link>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="ml-2 text-xs bg-[#CA6F86] text-white px-2 py-1 rounded hover:bg-[#B85A75]"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
