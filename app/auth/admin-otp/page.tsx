"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type OtpState = "loading" | "success" | "error"

function AdminOtpClient() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [state, setState] = useState<OtpState>("loading")
  const [message, setMessage] = useState("Verifying your secure admin login link...")

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState("error")
        setMessage("OTP token is missing.")
        return
      }

      try {
        const res = await fetch(`/api/auth/admin/otp/verify?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          setState("error")
          setMessage(data?.error || "OTP verification failed.")
          return
        }
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        setState("success")
        setMessage("OTP verified. Redirecting to Admin dashboard...")
        setTimeout(() => router.push("/admin"), 1200)
      } catch {
        setState("error")
        setMessage("OTP verification failed.")
      }
    }
    run()
  }, [router, token])

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-[#EEE7DA] rounded-xl p-6 text-center font-WorkSans">
        <h1 className="text-2xl font-bold mb-2">Admin OTP Login</h1>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        {state === "loading" && (
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 mb-4">
            <span className="inline-block h-4 w-4 border-2 border-[#8D2741]/30 border-t-[#8D2741] rounded-full animate-spin" />
            <span>Please wait...</span>
          </div>
        )}
        {state === "error" && (
          <button onClick={() => router.push("/auth/login")} className="px-4 py-2 rounded bg-[#8D2741] text-white">
            Back to login
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-[#EEE7DA] rounded-xl p-6 text-center font-WorkSans">
            <h1 className="text-2xl font-bold mb-2">Admin OTP Login</h1>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block h-4 w-4 border-2 border-[#8D2741]/30 border-t-[#8D2741] rounded-full animate-spin" />
              <span>Loading secure login link...</span>
            </div>
          </div>
        </div>
      }
    >
      <AdminOtpClient />
    </Suspense>
  )
}
