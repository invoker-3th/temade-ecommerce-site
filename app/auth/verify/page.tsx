"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type VerifyState = "loading" | "success" | "error"

function VerifyEmailClient() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") || ""
  const otp = params.get("otp") || ""
  const [state, setState] = useState<VerifyState>("loading")
  const [message, setMessage] = useState("Verifying your email...")

  const otpLabel = useMemo(() => (otp ? `OTP: ${otp}` : ""), [otp])

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState("error")
        setMessage("Verification token is missing.")
        return
      }

      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          setState("error")
          setMessage(data?.error || "Verification failed.")
          return
        }

        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        setState("success")
        setMessage("Your email is verified. You can continue.")
      } catch {
        setState("error")
        setMessage("Verification failed.")
      }
    }
    run()
  }, [token])

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-[#EEE7DA] rounded-xl p-6 text-center font-WorkSans">
        <h1 className="text-2xl font-bold mb-2 font-garamond">Email Verification</h1>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        {otpLabel && <div className="text-xs text-gray-500 mb-4">{otpLabel}</div>}
        <div className="flex items-center justify-center gap-3">
          {state === "success" && (
            <>
              <button
                onClick={() => {
                  window.location.href = "/account"
                }}
                className="px-4 py-2 rounded bg-[#8D2741] text-white"
              >
                Go to account
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 rounded border border-[#EEE7DA] text-gray-700"
              >
                Home
              </button>
            </>
          )}
          {state === "error" && (
            <button
              onClick={() => router.push("/auth/register")}
              className="px-4 py-2 rounded bg-[#8D2741] text-white"
            >
              Try again
            </button>
          )}
          {state === "loading" && (
            <div className="text-xs text-gray-500">Please wait...</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-[#EEE7DA] rounded-xl p-6 text-center font-WorkSans">
            <h1 className="text-2xl font-bold mb-2 font-garamond">Email Verification</h1>
            <p className="text-sm text-gray-600">Loading verification...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  )
}
