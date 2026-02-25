import { getDatabase } from "@/lib/mongodb"

type AuditLogInput = {
  actorEmail: string
  action: string
  targetEmail?: string
  targetId?: string
  targetName?: string
  metadata?: Record<string, unknown>
}

export async function writeAuditLog(input: AuditLogInput) {
  try {
    const db = await getDatabase()
    await db.collection("admin_audit_logs").insertOne({
      actorEmail: input.actorEmail,
      action: input.action,
      targetName: input.targetName || null,
      targetEmail: input.targetEmail || null,
      targetId: input.targetId || null,
      metadata: input.metadata || {},
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Audit log write failed:", error)
  }
}
