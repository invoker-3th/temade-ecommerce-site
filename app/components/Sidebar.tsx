"use client"

import { useState, useEffect } from "react"
import { LogOut, User as UserIcon, ShoppingCart } from "lucide-react"
import { useAuth } from "../context/AuthContext"

type SidebarProps = {
  user: {
    fullName: string
    userName: string
  }
  activeTab: "account" | "orders" | "edit"
  setActiveTab: (tab: "account" | "orders" | "edit") => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { logout, isLoggingOut } = useAuth()

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isMobileMenuOpen])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden z-40 bg-white p-2 rounded-r-md shadow-md transition-all duration-400 ease-in-out
          ${isMobileMenuOpen ? "fixed top-[250px] left-64" : "absolute top-[255px] left-3"}`}
      >
        {isMobileMenuOpen ? "←" : "→"}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-[249px]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`w-64 lg:w-72 flex-shrink-0 h-auto transition-transform duration-300 ease-in-out z-30 
        lg:relative lg:translate-x-0 ${
          isMobileMenuOpen
            ? "fixed top-[250px] left-0 translate-x-0"
            : "fixed -translate-x-full lg:translate-x-0"
        }`}
      >
        <div className=" bg-white md:m-4">
          {/* Nav */}
          <nav>
            <button
              onClick={() => { setActiveTab("account"); setIsMobileMenuOpen(false); }}
              
              className={`w-full text-left px-4 py-3  transition-colors flex items-center space-x-3 ${
                activeTab === "account"
                  ? "bg-[#FFF2F5] text-[#464646] border-l-4 border-[#8D2741]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span>Account</span>
            </button>

            <button
              onClick={() => { setActiveTab("orders"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 ${
                activeTab === "orders"
                  ? "bg-[#FFF2F5] text-[#464646] border-l-4 border-[#8D2741]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Orders</span>
            </button>
          </nav>

          {/* Logout */}
          <div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
