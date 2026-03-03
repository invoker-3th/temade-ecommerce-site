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
    permissions: ["team:view","team:message","seo:view","site:analytics:view","content:edit","catalog:edit","orders:view","orders:edit","users:view"],
    emailSubscriptions: ["order.created","seo.report.available","admin.login"]
  },
  {
    name: "general_admin",
    description: "General admin with day-to-day operational access, including admin history view, without full wildcard super-admin.",
    permissions: [
      "admin:audit:view",
      "admin:roles:view",
      "team:view",
      "team:message",
      "users:view",
      "email:send",
      "orders:view",
      "orders:edit",
      "catalog:view",
      "catalog:edit",
      "content:edit",
      "lookbook:edit",
      "banner:edit",
      "seo:view",
      "site:analytics:view",
      "finance:reports"
    ],
    emailSubscriptions: ["order.created","content.updated","admin.login"]
  },
  {
    name: "content_editor",
    description: "Manage product pages, lookbook, and site content (banners, CMS). No access to financials or user management.",
    permissions: ["team:view","team:message","content:edit","catalog:view","lookbook:edit","banner:edit"],
    emailSubscriptions: ["content.updated"]
  },
  {
    name: "support",
    description: "View orders and help customers. Can create tickets and view order history but cannot edit products or CMS pages.",
    permissions: ["team:view","team:message","support:ticket:view","support:ticket:reply","orders:view","users:view"],
    emailSubscriptions: ["support.ticket.created","order.issue"]
  },
  {
    name: "finance",
    description: "Access to finance endpoints, payouts, and reconciliation data.",
    permissions: ["team:view","team:message","finance:reports","payouts:view","orders:refunds","finance:reconcile"],
    emailSubscriptions: ["payment.failed","refund.processed"]
  }
]

export async function POST(request: Request) {
  const perm = await requirePermissionFromRequest(request, "*")
  if (!perm.ok) return NextResponse.json({ error: "Only super admins can seed roles" }, { status: 403 })

  try {
    const db = await getDatabase()
    const now = new Date()
    const rolesCol = db.collection("roles")
    let created = 0
    let updated = 0

    for (const role of defaults) {
      const existing = await rolesCol.findOne({ name: role.name }, { projection: { _id: 1 } })
      if (existing) {
        await rolesCol.updateOne(
          { _id: existing._id },
          {
            $set: {
              description: role.description,
              permissions: role.permissions,
              emailSubscriptions: role.emailSubscriptions,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
              createdBy: perm.adminEmail,
            },
          }
        )
        updated += 1
      } else {
        await rolesCol.insertOne({ ...role, createdAt: now, updatedAt: now, createdBy: perm.adminEmail })
        created += 1
      }
    }

    return NextResponse.json({ seeded: true, created, updated, totalDefaults: defaults.length })
  } catch (err) {
    console.error("Seed roles error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
