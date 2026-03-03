const PERMISSION_MEANINGS: Record<string, string> = {
  "admin:roles:view": "View all roles in the admin console.",
  "admin:roles:create": "Create new roles.",
  "admin:roles:edit": "Edit role name, description, and permissions.",
  "admin:roles:delete": "Delete existing roles.",
  "admin:roles:assign": "Assign and remove roles for users.",
  "admin:audit:view": "View admin activity and audit logs.",
  "users:view": "View user profiles and lists.",
  "users:manage": "Edit user details and account status.",
  "orders:view": "View orders.",
  "orders:edit": "Update order workflow and status.",
  "orders:refunds": "Handle refund operations.",
  "finance:reports": "View finance and revenue reports.",
  "finance:reconcile": "Perform finance reconciliation tasks.",
  "payouts:view": "View payout records.",
  "catalog:view": "View catalog records in admin.",
  "catalog:edit": "Create, edit, and delete products and categories.",
  "content:edit": "Edit CMS pages and site content.",
  "lookbook:edit": "Manage lookbook content.",
  "banner:edit": "Edit top bar and promotional banners.",
  "seo:view": "View SEO and site analysis data.",
  "seo:edit": "Edit SEO settings and metadata.",
  "site:analytics:view": "View analytics dashboards.",
  "site:analytics:manage": "Run sensitive analytics actions such as clear or reset.",
  "email:send": "Send manual emails from admin tools.",
  "support:ticket:view": "View support tickets.",
  "support:ticket:reply": "Reply to support tickets.",
}

export function permissionMeaning(permission: string) {
  return PERMISSION_MEANINGS[permission] || "Permission is granted for this action."
}

