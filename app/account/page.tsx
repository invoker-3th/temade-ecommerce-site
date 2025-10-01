"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil } from "lucide-react"
import Sidebar from "../components/Sidebar"
import EditProfile from "../components/edit-profile"
import OrdersTab from "../components/orders-tab"
import { useAuth } from "../context/AuthContext"

type UserProfile = {
  fullName: string
  userName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export default function AccountPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth() // 👈 get from context
  const [activeTab, setActiveTab] = useState<"account" | "orders" | "edit">("account")
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // 🔒 Protect route
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  // ✅ Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const res = await fetch(`/api/profile?userId=${user._id}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
        } else {
          console.error("No profile found")
          router.push("/create-profile")
        }
      } catch (error) {
        console.error("Profile fetch error:", error)
      }
    }
    fetchProfile()
  }, [user, router])

  const handleSaveComplete = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile)
    setActiveTab("account")
  }

  if (isLoading) {
    return <p className="p-6 text-center">Loading...</p>
  }

  if (!profile) return null

  return (
    <>
      {/* Header */}
      <div
        className="w-full bg-[url('/auth-header-image.jpg')] bg-cover bg-center h-[150px] md:h-[223px]"
        style={{ backgroundPosition: "center 25%" }}
      >
        <div className="w-full h-full bg-[#00000066] flex flex-col items-center justify-center px-4 gap-4">
          <h1 className="text-2xl md:text-4xl lg:text-[64px] font-semibold text-[#FFFFFF] text-center leading-tight">
            Hi, {profile?.userName ?? "Guest"} Welcome back to Temade.
          </h1>
          <ul className="flex items-center gap-2 md:gap-4 mb-4 text-[#E6E6E6] text-sm md:text-base">
            <li>
              <Link href="/" className="text-[#CA6F86] hover:underline">
                Home
              </Link>
            </li>
            <span>/</span>
            <li>
              <span className="hover:underline">Account</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Layout */}
      <div className="bg-[#FFFBEB] flex font-sans ">
        <Sidebar user={profile} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main */}
        <main className="flex-1 pt-10 md:pt-4 space-y-4 md:space-y-6 p-4">
          {activeTab === "account" && (
            <div>
              <div className="flex justify-between md:items-start mb-6">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Account Information</h1>
                  <p className="text-[10px] md:text-[16px]">Your entire personal information is here</p>
                </div>
                <button
                  onClick={() => setActiveTab("edit")}
                  className="px-4 py-2 bg-[#8D2741] text-white rounded-md flex items-center"
                >
                  <Pencil size={16} className="mr-1" />
                  Edit
                </button>
              </div>

              {/* Personal Info */}
              <div className=" grid md:grid-cols-2 gap-4 items-center">
                <div className=" w-full">
                  <p className="font-medium">Full Name:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4 rounded bg-[#FFFDF4] text-[15px] md:text-[16px]">{profile.fullName}</p>
                </div>
                <div className="max-w-full">
                  <p className="font-medium">Username:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px] md:text-[16px]">{profile.userName}</p>
                </div>
                <div className="max-w-full">
                  <p className="font-medium">Email:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px] md:text-[16px]">{profile.email}</p>
                </div>
                <div className="max-w-full">
                  <p className="font-medium">Phone:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px] md:text-[16px]">{profile.phone}</p>
                </div>
              </div>
              <div className="py-2 max-w-full ">
                <p className="font-medium">Address:</p>
                <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px] md:text-[16px]">{profile.address}</p>
              </div>

              {/* Delivery Info */}
              <div className=" grid md:grid-cols-2 gap-4 items-center">
                <div className="max-w-full">
                  <p className="font-medium">City/Town:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px] md:text-[16px]">{profile.city}</p>
                </div>
                <div className="max-w-full">
                  <p className="font-medium">State:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px]">{profile.state}</p>
                </div>
                <div className="max-w-full">
                  <p className="font-medium">Country:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px]">{profile.country}</p>
                </div>
                <div className="max-w-full">
                  <p className="font-medium">Zip Code:</p>
                  <p className="border border-[#D0D5DD] p-2 md:p-4  rounded bg-[#FFFDF4] text-[15px]">{profile.zipCode}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "edit" && profile && (
            <EditProfile
              onSaveComplete={handleSaveComplete}
              initialData={profile}
            />
          )}
        </main>
      </div>
    </>
  )
}
