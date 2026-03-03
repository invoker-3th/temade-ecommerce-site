"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type InviteState = "loading" | "success" | "error"

function AdminInviteClient() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [state, setState] = useState<InviteState>("loading")
  const [message, setMessage] = useState("Confirming your admin invite...")

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState("error")
        setMessage("Invite token is missing.")
        return
      }

      try {
        const res = await fetch(`/api/auth/admin/accept?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          setState("error")
          setMessage(data?.error || "Invite confirmation failed.")
          return
        }

        setState("success")
        const acceptedEmail = encodeURIComponent(String(data?.user?.email || ""))
        const acceptedUserName = encodeURIComponent(String(data?.user?.userName || ""))
        setMessage("Invite verified. Preparing your secure admin login flow.")
        setTimeout(() => {
          router.push(`/auth/login?email=${acceptedEmail}&userName=${acceptedUserName}&invite=1&auto=1`)
        }, 1800)
      } catch {
        setState("error")
        setMessage("Invite confirmation failed.")
      }
    }

    run()
  }, [router, token])

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-[#EEE7DA] rounded-xl p-6 text-center font-WorkSans">
        <h1 className="text-2xl font-bold mb-2 font-garamond">Admin Access Confirmed</h1>
        <p className="text-sm text-gray-600 mb-4">{message}</p>

        {state === "success" && (
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => router.push("/auth/login")}
              className="px-4 py-2 rounded bg-[#8D2741] text-white"
            >
              Continue to Login
            </button>
          </div>
        )}

        {state === "error" && (
          <button onClick={() => router.push("/auth/login")} className="px-4 py-2 rounded bg-[#8D2741] text-white">
            Back to login
          </button>
        )}

        {state === "loading" && (
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block h-4 w-4 border-2 border-[#8D2741]/30 border-t-[#8D2741] rounded-full animate-spin" />
            <span>Please wait...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-[#EEE7DA] rounded-xl p-6 text-center font-WorkSans">
            <h1 className="text-2xl font-bold mb-2 font-garamond">Admin Invite</h1>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block h-4 w-4 border-2 border-[#8D2741]/30 border-t-[#8D2741] rounded-full animate-spin" />
              <span>Loading invite...</span>
            </div>
          </div>
        </div>
      }
    >
      <AdminInviteClient />
    </Suspense>
  )
}
