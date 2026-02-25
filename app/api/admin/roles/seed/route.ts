import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requirePermissionFromRequest } from "@/lib/server/permissionGuard"

const defaults = [
  {
    name: "admin",
    description: "Full super-admin. Can manage roles, users, settings, and view all audit logs. Intended for Owner-level accounts.",
    permissions: ["*"],
    emailSubscriptions: ["*", "admin.login"]
  },
  {
    name: "manager",
    description: "Manage content overview (SEO analytics & CMS pages), orders, and customers. Cannot change billing or assign roles or platform-wide settings.",
    permissions: ["seo:view","site:analytics:view","content:edit","orders:view","orders:edit","users:view"],
    emailSubscriptions: ["order.created","seo.report.available","admin.login"]
  },
  {
    name: "content_editor",
    description: "Manage product pages, lookbook, and site content (banners, CMS). No access to financials or user management.",
    permissions: ["content:edit","catalog:view","lookbook:edit","banner:edit"],
    emailSubscriptions: ["content.updated"]
  },
  {
    name: "support",
    description: "View orders and help customers. Can create tickets and view order history but cannot edit products or CMS pages.",
    permissions: ["support:ticket:view","support:ticket:reply","orders:view","users:view"],
    emailSubscriptions: ["support.ticket.created","order.issue"]
  },
  {
    name: "finance",
    description: "Access to finance endpoints, payouts, and reconciliation data.",
    permissions: ["finance:reports","payouts:view","orders:refunds","finance:reconcile"],
    emailSubscriptions: ["payment.failed","refund.processed"]
  }
]

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "admin:roles:create")
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status })

  try {
    const db = await getDatabase()
    const existing = await db.collection("roles").countDocuments()
    if (existing > 0) return NextResponse.json({ seeded: false, message: "Roles already exist" })

    const now = new Date()
    const docs = defaults.map(d => ({ ...d, createdAt: now, updatedAt: now, createdBy: perm.adminEmail }))
    await db.collection("roles").insertMany(docs)
    return NextResponse.json({ seeded: true })
  } catch (err) {
    console.error("Seed roles error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
