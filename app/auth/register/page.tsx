"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await register(formData)

    if (success) {
      router.push("/")
    } else {
      setError("Registration failed. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <>
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
      <div className="bg-[#FFFBEB] flex items-center justify-center px-4 py-[48px] font-sans">
        <div className="max-w-md w-full  rounded-[5px] border-[1px] border-[#D3D3D3] p-8">
          <h1 className="text-2xl font-bold  text-[#222222] mb-8">Register</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#333] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CA6F86] bg-transparent"
                  placeholder="Enter preferred username"
                />
              </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#333] mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CA6F86] bg-transparent"
                placeholder="Enter your email"
              />
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-fit bg-[#8D2741] text-white p-3 rounded-md hover:bg-[#111] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-[#717171]">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#CA6F86] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
