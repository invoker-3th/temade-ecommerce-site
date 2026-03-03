"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Toaster } from "react-hot-toast"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"

type NavItem = { label: string; href: string; disabled?: boolean; permission?: string }
type NavSection = { title: string; items: NavItem[] }

const nav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Site Analysis", href: "/admin/site-analysis", permission: "seo:view" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Users", href: "/admin/users", permission: "users:view" },
      { label: "Orders", href: "/admin/orders", permission: "orders:view" },
      { label: "Finance", href: "/admin/finance", permission: "finance:reports" },
    ],
  },
  {
    title: "Catalog & CMS",
    items: [
      { label: "Inventory", href: "/admin/inventory", permission: "catalog:view" },
      { label: "Lookbook", href: "/admin/lookbook", permission: "content:edit" },
      { label: "CMS Pages", href: "/admin/cms/pages", permission: "content:edit" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Banner Settings", href: "/admin/settings/banner", permission: "banner:edit" },
      { label: "SEO Settings", href: "/admin/settings/seo", permission: "seo:edit" },
      { label: "Team & Roles", href: "/admin/settings/team", permission: "team:view" },
      { label: "Roles", href: "/admin/settings/roles", permission: "admin:roles:view" },
      { label: "Admin Logs", href: "/admin/audit", permission: "admin:audit:view" },
    ],
  },
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading, isLoggingOut, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const lastActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!mobileOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    lastActiveElement.current = document.activeElement as HTMLElement | null
    const menu = mobileMenuRef.current
    if (!menu) return

    const focusable = menu.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setMobileOpen(false)
        return
      }
      if (event.key !== "Tab" || focusable.length === 0) return

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = originalOverflow
      lastActiveElement.current?.focus()
    }
  }, [mobileOpen])

  const [permissions, setPermissions] = useState<string[] | null>(null)
  const isAdminPrincipal = useMemo(() => {
    if (!user?.email) return false
    if (user.role === "admin") return true
    const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(/[,\n;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    return allow.includes(user.email.toLowerCase())
  }, [user?.email, user?.role])
  const canAccessAdmin = useMemo(() => {
    if (isAdminPrincipal) return true
    if (!permissions) return false
    return permissions.length > 0
  }, [isAdminPrincipal, permissions])

  useEffect(() => {
    if (!user?.email) return
    const fetchPerms = async () => {
      try {
        const adminEmail = user.email.trim().toLowerCase()
        const res = await fetch(`/api/admin/me?email=${encodeURIComponent(adminEmail)}`, {
          headers: { "x-admin-email": adminEmail },
        })
        if (!res.ok) return setPermissions([])
        const data = await res.json()
        setPermissions(Array.isArray(data.permissions) ? data.permissions : [])
      } catch (err) {
        console.error(err)
        setPermissions([])
      }
    }
    fetchPerms()
  }, [user?.email])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center font-WorkSans">
        Loading...
      </div>
    )
  }

  if (!isAdminPrincipal && permissions === null) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center font-WorkSans">
        Loading...
      </div>
    )
  }

  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center gap-3 font-WorkSans">
        <p className="text-lg">Access denied</p>
        <Link href="/" className="text-[#CA6F86] underline">Go home</Link>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FFFBEB] text-[#16161A] flex admin-scope font-WorkSans">
      <aside className="w-64 h-screen bg-white border-r border-[#EEE7DA] px-5 py-6 hidden md:flex md:flex-col overflow-y-auto">
        <div className="mb-6">
          <p className="text-xs tracking-widest text-gray-500">TEMADE STUDIOS</p>
          <p className="text-lg font-bold">Admin Console</p>
        </div>

        <nav className="flex-1 space-y-6">
          {nav.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href)

                  if (item.disabled) {
                    return (
                      <div key={item.label} className="flex items-center justify-between px-3 py-2 text-sm rounded text-gray-400 bg-gray-50">
                        <span>{item.label}</span>
                        <span className="text-[10px] uppercase tracking-wide">Soon</span>
                      </div>
                    )
                  }

                  // hide item if permission required and not present (permissions null -> loading -> hide until known)
                  if (item.permission) {
                    if (!permissions) return null
                    if (!(permissions.includes("*") || permissions.includes(item.permission))) return null
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`block px-3 py-2 text-sm rounded ${isActive ? "bg-[#CA6F86] text-white" : "text-gray-700 hover:bg-[#F4EFE7]"}`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-[#EEE7DA]">
          <div className="text-xs text-gray-500 mb-2">Signed in as</div>
          <div className="text-sm font-semibold truncate mb-0">
            {user?.fullName || user?.userName || "Admin"}
          </div>
          <div className="text-xs text-gray-500 truncate mb-3">
            {user?.email}
          </div>
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="w-full px-3 py-2 text-sm rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 h-screen flex flex-col">
        <div className="md:hidden bg-white border-b border-[#EEE7DA] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">TEMADE ADMIN</p>
            <p className="font-semibold">Menu</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="px-3 py-2 text-sm rounded border border-[#EEE7DA] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="flex flex-col gap-1">
                <span className="block w-4 h-0.5 bg-gray-700" />
                <span className="block w-4 h-0.5 bg-gray-700" />
                <span className="block w-4 h-0.5 bg-gray-700" />
              </span>
              Menu
            </button>
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className="px-3 py-2 text-sm rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>

        <div className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <button
            aria-label="Close menu"
            className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setMobileOpen(false)}
          />
          <div
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className={`absolute left-0 top-0 h-full w-72 bg-white border-r border-[#EEE7DA] px-5 py-6 flex flex-col transform transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs tracking-widest text-gray-500">TEMADE STUDIOS</p>
                <p className="text-lg font-bold">Admin Console</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-sm text-gray-600"
              >
                Close
              </button>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto">
              {nav.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href)

                      if (item.disabled) {
                        return (
                          <div key={item.label} className="flex items-center justify-between px-3 py-2 text-sm rounded text-gray-400 bg-gray-50">
                            <span>{item.label}</span>
                            <span className="text-[10px] uppercase tracking-wide">Soon</span>
                          </div>
                        )
                      }

                      if (item.permission) {
                        if (!permissions) return null
                        if (!(permissions.includes("*") || permissions.includes(item.permission))) return null
                      }

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-2 text-sm rounded ${isActive ? "bg-[#CA6F86] text-white" : "text-gray-700 hover:bg-[#F4EFE7]"}`}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="pt-4 border-t border-[#EEE7DA]">
              <div className="text-xs text-gray-500 mb-2">Signed in as</div>
              <div className="text-sm font-semibold truncate mb-0">
                {user?.fullName || user?.userName || "Admin"}
              </div>
              <div className="text-xs text-gray-500 truncate mb-3">
                {user?.email}
              </div>
              <button
                onClick={logout}
                disabled={isLoggingOut}
                className="w-full px-3 py-2 text-sm rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster position="bottom-right" />
      </div>
    </div>
  )
}
