function parseEmailList(value: string | undefined) {
  return String(value || "")
    .split(/[,\n;\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

export function getAllowlistedAdmins() {
  const merged = [
    ...parseEmailList(process.env.NEXT_PUBLIC_ADMIN_EMAILS),
    ...parseEmailList(process.env.ADMIN_EMAILS),
    ...parseEmailList(process.env.ADMIN_OWNER_EMAILS),
    ...parseEmailList(process.env.OWNER_EMAILS),
  ]
  return Array.from(new Set(merged))
}

export function isAllowlistedAdmin(email: unknown) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false
  return getAllowlistedAdmins().includes(normalized)
}
