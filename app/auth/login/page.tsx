"use client"

import type React from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginClient() {
  const [email, setEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoLoginAttempted = useRef(false)

  const doLogin = async (emailInput: string, userNameInput: string) => {
    setIsLoading(true)
    setError("")

    const result = await login(emailInput, userNameInput)

    if (result.success) {
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(/[,\n;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
      if (adminEmails.includes(emailInput.toLowerCase())) {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } else if (result.requiresAdminOtp) {
      setError(result.message || "A secure OTP login link has been sent to your verified email.")
    } else {
      setError(result.message || "Login failed. Please check your email.")
    }

    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await doLogin(email, userName)
  }

  useEffect(() => {
    const qpEmail = searchParams.get("email") || ""
    const qpUserName = searchParams.get("userName") || ""
    const invite = searchParams.get("invite") === "1"
    const auto = searchParams.get("auto") === "1"

    if (qpEmail) setEmail(qpEmail)
    if (qpUserName) setUserName(qpUserName)
    if (!invite || !auto || autoLoginAttempted.current || !qpEmail || !qpUserName) return

    autoLoginAttempted.current = true
    void doLogin(qpEmail, qpUserName)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
      <div className=" bg-[#FFFBEB] flex items-center justify-center px-4 py-[48px] font-sans">
        <div className="max-w-md w-full bg-transparent rounded-[5px] border-[1px] border-[#D3D3D3] p-5">
          <h1 className="text-2xl font-bold  text-[#222222] mb-8">Log In</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#333] mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#CA6F86] bg-transparent"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#333] mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#CA6F86] bg-transparent"
                placeholder="Enter email address"
              />
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-fit bg-[#8D2741] text-white p-3 rounded-md hover:bg-[#111] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Checking..." : "Sign In / Request OTP"}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-[#717171]">
              Do not have an account?{" "}
              <Link href="/auth/register" className="text-[#CA6F86] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">Loading login...</div>}>
      <LoginClient />
    </Suspense>
  )
}

