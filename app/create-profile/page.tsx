"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../context/AuthContext" // 👈 import your auth hook

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

export default function CreateProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth() // 👈 get logged-in user from context

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?._id) {
      alert("You must be logged in to create a profile.")
      return
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId: user._id, // 👈 send logged-in user's ID
        }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log("Profile saved:", data)
        router.push("/account")
      } else {
        const err = await res.json()
        alert(err.message || "Failed to save profile")
      }
    } catch (error) {
      console.error("Profile save error:", error)
      alert("Something went wrong.")
    }
    
  }

  return (
    <div className="font-sans">
      <div className="w-full bg-[url('/auth-header-image.jpg')] bg-cover bg-center h-[223px] font-sans"
        style={{ backgroundPosition: "center 25%" }}>
        <div className="w-full h-full bg-[#00000066] flex items-end justify-center">
          <ul className="flex items-center gap-4 mb-4 text-[#E6E6E6]">
            <li><Link href="/" className="text-[#CA6F86] hover:underline">Home</Link></li>
            <span>/</span>
            <li><Link href="#" className=" hover:underline">Account</Link></li>
          </ul>
        </div>
      </div>
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">Create Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inputs */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", name: "fullName", type: "text", placeholder: "John Doe" },
                { label: "Username", name: "userName", type: "text", placeholder: "johndoe" },
                { label: "Email", name: "email", type: "email", placeholder: "johndoe@example.com" },
                { label: "Phone Number", name: "phone", type: "tel", placeholder: "+23801234567" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={field.type}
                      name={field.name}
                      value={(formData[field.name as keyof UserProfile] || "")}
                      onChange={handleChange}
                      required
                      placeholder={field.placeholder}
                      className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                    />
                    <Pencil
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
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
                  required
                  placeholder="15, Demilade Jefferson Street"
                  className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                />
                <Pencil
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium mb-1">Town/City</label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Ikeja"
                    className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                  />
                  <Pencil
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zipcode</label>
                <div className="relative">
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    placeholder="100001"
                    className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                  />
                  <Pencil
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <div className="relative">
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="Enter your state"
                    className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                  />
                  <Pencil
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* Country Select */}
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full border border-[#D0D5DD] p-3 pr-10 rounded-[6px] bg-[#FFFDF4] focus:ring-2 focus:ring-[#8D2741] outline-none"
                  >
                    <option value="">Select Country</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="US">US</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-[#8D2741] text-white rounded-md hover:bg-[#6e1f34] transition"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
