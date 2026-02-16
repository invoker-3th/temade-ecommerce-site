"use client"

import { useEffect, useState } from "react"

const CONSENT_KEY = "cookie_consent"

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const handleChoice = (value: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, value)
    setVisible(false)
    if (value === "accepted") {
      window.location.reload()
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] bg-white border-t border-[#EEE7DA] px-4 py-4 md:px-8 font-WorkSans">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-[#2C2C2C]">
        <div>
          <p className="text-base font-semibold font-garamond">Cookie Preferences</p>
          <p>
            We use analytics cookies to understand site usage and improve performance. You can accept or decline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleChoice("rejected")}
            className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            onClick={() => handleChoice("accepted")}
            className="px-3 py-2 text-sm rounded bg-[#2C2C2C] text-white"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
