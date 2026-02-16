import type React from "react"
import type { Metadata } from "next"
import { EB_Garamond, Work_Sans } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import NavBar from "./components/NavBar"
import TopBar from "./components/TopBar"
import { CartProvider } from "./context/CartContext"
import { WishlistProvider } from "./context/WishlistContext"
import { AuthProvider } from "./context/AuthContext"
import Footer from "./components/Footer"
import TextMarqueeBar from "./components/TextMarqueeBar"
import { CurrencyProvider } from "./context/CurrencyContext"
import RegionDialog from "./components/RegionDialog"
import CartCurrencyUpdater from "./components/CartCurrencyUpdater"
import PostHogClient from "./components/PostHogClient"
import CookieConsentBanner from "./components/CookieConsentBanner"


const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
})

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-WorkSans",
})

export const metadata: Metadata = {
  title: "Temade",
  description: "Temade E-commerce",
  icons: {
    icon: "/temade-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID || "G-PPQS15MZEG"

  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}
        </Script>
      </head>
      <body
        className={`${ebGaramond.variable} ${workSans.variable} bg-[#FFFBEB] antialiased text-black dark:bg-[#111111] dark:text-white font-garamond`}
      >
        <CurrencyProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <TopBar />
                <NavBar />
                {/* Region selection dialog shown when no currency is set */}
                <RegionDialog />
                {/* Update cart prices when currency changes */}
                <CartCurrencyUpdater />
                <PostHogClient />
                {children}
                <TextMarqueeBar />
                <div className="w-full flex justify-center">
                  <Footer />
                </div>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </CurrencyProvider>
        <CookieConsentBanner />
      </body>
    </html>
  )
}
