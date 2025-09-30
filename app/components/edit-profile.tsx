"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Pencil } from "lucide-react"

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
}

export default function EditProfile({ onSaveComplete }: EditProfileProps) {
  const [formData, setFormData] = useState<UserProfile>({
    fullName: "",
    userName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  })

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile")
    if (storedProfile) {
      setFormData(JSON.parse(storedProfile))
    }
  }, [])

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
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error("Failed to update profile")
      }

      const updatedProfile = await res.json()
      onSaveComplete(updatedProfile) // Pass updated profile back to parent
    } catch (err) {
      console.error("Profile update error:", err)
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
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                >
                  <option value="">Select Town/City</option>
                  <option value="Ikeja">Ikeja</option>
                  <option value="Yaba">Yaba</option>
                  <option value="Ikorodu">Ikorodu</option>
                </select>
              </div>
            </div>

            {/* select state */}
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <div className="relative">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                >
                  <option value="">Select State</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                </select>
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
