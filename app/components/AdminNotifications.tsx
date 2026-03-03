"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"

type Notification = {
  _id: string
  type: "payment_confirmed" | "order_updated" | "new_order" | "new_user" | "team_message"
  title: string
  message: string
  orderId?: string
  userId?: string
  userEmail?: string
  senderEmail?: string
  recipientEmail?: string
  paymentReference?: string
  amount?: number
  read: boolean
  createdAt: string
}

export default function AdminNotifications() {
  const { user } = useAuth()
  const adminEmail = user?.email?.trim().toLowerCase() || ""
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Notification | null>(null)

  const fetchNotifications = async () => {
    if (!adminEmail) return
    try {
      const response = await fetch("/api/admin/notifications", { headers: { "x-admin-email": adminEmail } })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!adminEmail) return
    fetchNotifications()
  }, [adminEmail])

  const markAsRead = async (notificationId: string) => {
    if (!adminEmail) return
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": adminEmail },
        body: JSON.stringify({ notificationId }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const openNotification = async (notification: Notification) => {
    setSelected(notification)
    if (!notification.read) {
      await markAsRead(notification._id)
    }
  }

  if (loading) return <div>Loading notifications...</div>

  const unreadCount = notifications.filter((n) => !n.read).length

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
        <button onClick={fetchNotifications} className="text-sm text-[#CA6F86] hover:underline">
          Refresh
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No notifications</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {notifications.map((notification) => (
            <motion.button
              key={notification._id}
              onClick={() => openNotification(notification)}
              whileHover={{ scale: 1.01 }}
              className={`w-full text-left p-3 rounded-lg border transition ${
                notification.read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-[#16161A]">{notification.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.read && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8D2741] text-white">New</span>}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-xl bg-white rounded-2xl border border-[#EEE7DA] shadow-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#16161A]">{selected.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(selected.createdAt).toLocaleString()}</p>
                  {selected.type === "team_message" && (
                    <p className="text-xs text-gray-600 mt-1">From: {selected.senderEmail || "Unknown sender"}</p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="text-sm text-gray-600">Close</button>
              </div>

              <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{selected.message}</p>

              {selected.paymentReference && (
                <p className="text-xs text-gray-500 mt-3">Ref: {selected.paymentReference}</p>
              )}
              {selected.orderId && (
                <p className="text-xs mt-3">
                  <Link
                    href={`/admin/orders?orderId=${encodeURIComponent(selected.orderId)}`}
                    className="text-[#CA6F86] underline"
                    onClick={() => setSelected(null)}
                  >
                    Open order
                  </Link>
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

