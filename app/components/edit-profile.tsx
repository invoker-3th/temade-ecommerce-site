"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { useCurrency, type SupportedCurrency } from "../context/CurrencyContext"
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

interface EditProfileProps {
  onSaveComplete: (updatedProfile: UserProfile) => void // Added callback prop to return to account tab
  initialData: UserProfile
}

export default function EditProfile({ onSaveComplete, initialData }: EditProfileProps) {
  const [formData, setFormData] = useState<UserProfile>(initialData)
  const { currency, setCurrency } = useCurrency()
  const { user } = useAuth()

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!user?._id) {
        throw new Error("You must be logged in to update profile")
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user._id, ...formData }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Failed to update profile")
      }

      const data = await res.json()
      const updatedProfile = data?.profile || data // support both shapes
      onSaveComplete(updatedProfile)
    } catch (err) {
      console.error("Profile update error:", err)
      alert(err instanceof Error ? err.message : "Failed to update profile")
    }
  }


  return (
    <div className="bg-[#FFFBEB] flex items-center justify-center">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grid for inputs */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: "Full Name", name: "fullName", type: "text" },
              { label: "Username", name: "userName", type: "text" },
              { label: "Email", name: "email", type: "email" },
              { label: "Phone Number", name: "phone", type: "tel" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof UserProfile] || ""}
                    onChange={handleChange}
                    className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                  />
                  <Pencil size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D2741]" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <div className="relative">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
              />
              <Pencil size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D2741]" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* select town */}
            <div>
              <label className="block text-sm font-medium mb-1">Town/City</label>
              <div className="relative">
                <input
                    type="text"
                    id="city"
                    name="city"
                    placeholder="Enter your city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                  />
              </div>
              <Pencil size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D2741]" />
            </div>

            {/* select state */}
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <div className="relative">
                 <input
                    type="text"
                    id="state"
                    name="state"
                    placeholder="Enter your state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                  />
                  <Pencil size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D2741]" />
              </div>
            </div>

            {/* Country Select */}
            <div>
              <label className="block text-sm font-medium">Country</label>
              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                >
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Uganda">Uganda</option>
                  <option value="US">US</option>
                  <option value="UK">UK</option>
                </select>
              </div>
            </div>
            <div >
              <label className="block text-sm font-medium">Zip Code</label>
              <div className="relative">
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                />
                <Pencil size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D2741]" />
              </div>
            </div>
          </div>

          {/* Currency Preference */}
          <div>
            <label className="block text-sm font-medium mb-1">Preferred currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
            >
              <option value="NGN">Nigeria (₦)</option>
              <option value="USD">USA & Others ($)</option>
              <option value="GBP">United Kingdom (£)</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">This sets prices across the site.</p>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-[#8D2741] text-white rounded-md hover:bg-[#6e1f34] transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
