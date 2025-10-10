'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import ShippingPolicyModal from './ShippingPolicyModal'
import PrivacyPolicyModal from './PrivacyPolicyModal'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Subscribed email:', email)
    setEmail('')
  }

  return (
    <>
      <footer className="w-full bg-[#FFD7E1] py-10 px-6 md:px-16 mx-auto max-w-screen-2xl font-WorkSans">
        <div className="flex flex-col md:flex-row md:justify-between gap-10 flex-wrap">
          {/* Logo Section */}
          <div className="flex flex-col gap-2">
            <Link href="/">
              <Image
                src="/temade-icon.png"
                alt="Temade Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-[#5A554C] text-xs font-medium">
              © {new Date().getFullYear()} ALL RIGHTS RESERVED
            </p>
            <p className="text-sm text-[#5A554C] font-medium">
              Orders@temadestudios.com
            </p>
          </div>

          {/* Useful Links */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-[#5A554C]">LINKS</p>
            <a href="https://www.instagram.com/temade_studios" className="text-sm text-[#5A554C] hover:underline">
              Instagram
            </a>
            <a href="#" className="text-sm text-[#5A554C] hover:underline">
              Contact Us
            </a>
            <a href="#" className="text-sm text-[#5A554C] hover:underline">
              About Us
            </a>
          </div>

          {/* Policies */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-[#5A554C]">POLICIES</p>
            <button
              onClick={() => setShowShippingModal(true)}
              className="text-left text-sm text-[#5A554C] hover:underline"
            >
              Shipping Policy
            </button>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-left text-sm text-[#5A554C] hover:underline"
            >
              Privacy Policy
            </button>
            <a href="#" className="text-sm text-[#5A554C] hover:underline">
              Terms of Service
            </a>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-3 w-full sm:w-auto max-w-md">
            <p className="text-sm text-[#5A554C] font-medium">
              SUBSCRIBE TO OUR MAILING LIST
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-10 rounded-md border bg-transparent border-[#929292] placeholder-[#5A554C] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A554C] py-2"
                required
              />
              <button
                type="submit"
                className="h-10 px-4 bg-[#5A554C] text-white rounded-md text-sm hover:bg-opacity-90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ShippingPolicyModal
        open={showShippingModal}
        onClose={() => setShowShippingModal(false)}
      />
      <PrivacyPolicyModal
        open={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </>
  )
}
