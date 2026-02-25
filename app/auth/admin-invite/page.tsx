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
  const [showDialog, setShowDialog] = useState(false)

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

        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        setState("success")
        setMessage("Your admin access has been verified. You’ll be redirected to your dashboard shortly.")
        setShowDialog(true)
        setTimeout(() => {
          setShowDialog(false)
          router.push("/admin")
        }, 3000)
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
        {showDialog && (
          <div className="mx-auto mb-4 max-w-xs rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            You have been verified. Redirecting to your admin dashboard...
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 rounded bg-[#8D2741] text-white"
            >
              Go to Admin dashboard
            </button>
            <p className="text-[11px] text-gray-500">
              If you are not redirected automatically, click{" "}
              <button
                onClick={() => router.push("/admin")}
                className="underline text-[#8D2741]"
              >
                here
              </button>
              .
            </p>
          </div>
        )}

        {state === "error" && (
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 rounded bg-[#8D2741] text-white"
          >
            Back to login
          </button>
        )}

        {state === "loading" && <div className="text-xs text-gray-500">Please wait...</div>}
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
            <p className="text-sm text-gray-600">Loading invite...</p>
          </div>
        </div>
      }
    >
      <AdminInviteClient />
    </Suspense>
  )
}
