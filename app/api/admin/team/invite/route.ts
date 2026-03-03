import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { UserService } from "@/lib/services/userServices"
import { sendEmail } from "@/lib/email"
import { signAdminInviteJwt } from "@/lib/verificationTokens"
import type { User } from "@/lib/models/User"
import type { Role } from "@/lib/models/role"
import { requireAdminFromRequest } from "@/lib/server/adminGuard"
import { requireAnyPermissionFromRequest, requirePermissionFromRequest } from "@/lib/server/permissionGuard"
import { writeAuditLog } from "@/lib/audit"
import { permissionMeaning } from "@/lib/server/permissionMeanings"

type InviteDoc = {
  _id?: ObjectId
  userId: ObjectId
  email: string
  userName: string
  fullName?: string
  roleId: string
  roleName: string
  permissionSnapshot: string[]
  token: string
  expiresAt: Date
  usedAt: Date | null
  revokedAt?: Date | null
  resentAt?: Date | null
  createdAt: Date
  createdByEmail?: string
}

function buildInviteEmail(params: {
  displayName: string
  inviteLink: string
  roleName: string
  permissionDetails: Array<{ key: string; meaning: string }>
}) {
  const permHtml = params.permissionDetails.length
    ? `<ul>${params.permissionDetails
        .map((p) => `<li><strong>${p.key}</strong>: ${p.meaning}</li>`)
        .join("")}</ul>`
    : "<p>No permission definitions found for this role.</p>"
  const permText = params.permissionDetails.length
    ? params.permissionDetails.map((p) => `- ${p.key}: ${p.meaning}`).join("\n")
    : "- No permission definitions found for this role."

  return {
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>You're invited to Temade Admin</h2>
        <p>Hello ${params.displayName},</p>
        <p>You were invited to act as <strong>${params.roleName}</strong> on Temade.</p>
        <p>What you can do:</p>
        ${permHtml}
        <p>Click below to verify your email and activate access.</p>
        <p><a href="${params.inviteLink}" style="background:#8D2741;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Confirm Admin Access</a></p>
        <p>If the button does not work, use this link:</p>
        <p>${params.inviteLink}</p>
      </div>
    `,
    text: `You are invited to Temade as ${params.roleName}.\n\nWhat you can do:\n${permText}\n\nConfirm access: ${params.inviteLink}`,
  }
}

export async function GET(request: Request) {
  try {
    const viewer = await requireAnyPermissionFromRequest(request, ["team:view", "users:view"])
    if (!viewer.ok) return NextResponse.json({ error: viewer.error }, { status: viewer.status })
    const admin = await requireAdminFromRequest(request)
    const canManageTeam = admin.ok
    const canMessage = await requirePermissionFromRequest(request, "team:message")
    const canSendDirectEmail = await requirePermissionFromRequest(request, "email:send")

    const db = await getDatabase()
    const usersCol = db.collection<User>("users")
    const invitesCol = db.collection<InviteDoc>("admin_invites")

    const [allInvites, roleDocs] = await Promise.all([
      invitesCol
        .find(
          { revokedAt: null },
          {
            projection: {
              userId: 1,
              email: 1,
              userName: 1,
              roleId: 1,
              roleName: 1,
              permissionSnapshot: 1,
              usedAt: 1,
              createdAt: 1,
              expiresAt: 1,
            },
          }
        )
        .sort({ createdAt: -1 })
        .toArray(),
      db.collection<Role>("roles").find({}, { projection: { name: 1 } }).toArray(),
    ])

    const roleNameById = new Map(roleDocs.map((r) => [String(r._id), r.name || "role"]))

    const pendingInvites = allInvites
      .filter((x) => !x.usedAt && x.expiresAt > new Date())
      .map((x) => ({
        ...x,
        roleName: x.roleName || roleNameById.get(x.roleId) || "role",
      }))

    const invitedUserIds = Array.from(
      new Set(
        allInvites
          .map((x) => String(x.userId))
          .filter((id) => ObjectId.isValid(id))
      )
    ).map((id) => new ObjectId(id))

    const teamMembers = await usersCol
      .find(
        {
          $or: [
            { role: "admin" },
            { roles: { $exists: true, $ne: [] } },
            ...(invitedUserIds.length ? [{ _id: { $in: invitedUserIds } }] : []),
          ],
        },
        {
          projection: {
            email: 1,
            userName: 1,
            fullName: 1,
            isEmailVerified: 1,
            updatedAt: 1,
            createdAt: 1,
            roles: 1,
            role: 1,
          },
        }
      )
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({
      teamMembers,
      pendingInvites,
      capabilities: {
        canManageTeam,
        canMessageTeam: canMessage.ok,
        canSendDirectEmail: canSendDirectEmail.ok,
      },
    })
  } catch (error) {
    console.error("Admin team GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminFromRequest(request)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const body = await request.json()
    const email = String(body.email || "").trim().toLowerCase()
    const userName = String(body.userName || "").trim()
    const fullName = String(body.fullName || "").trim()
    const roleId = String(body.roleId || "").trim()

    if (!email || !userName || !fullName || !roleId) {
      return NextResponse.json(
        { error: "Full name, username, email, and role are required." },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }
    if (!ObjectId.isValid(roleId)) {
      return NextResponse.json({ error: "Please select a valid role." }, { status: 400 })
    }

    const db = await getDatabase()
    const invitesCol = db.collection<InviteDoc>("admin_invites")
    const rolesCol = db.collection<Role>("roles")
    const usersCol = db.collection("users")
    const secret = process.env.EMAIL_VERIFICATION_JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Email verification secret is missing" }, { status: 500 })
    }

    const rolesCount = await rolesCol.countDocuments({})
    if (rolesCount === 0) {
      return NextResponse.json(
        { error: "No roles exist yet. Create a role first, then invite the admin with that role." },
        { status: 400 }
      )
    }

    const roleDoc = await rolesCol.findOne({ _id: new ObjectId(roleId) })
    if (!roleDoc) {
      return NextResponse.json(
        { error: "Selected role not found. Create/select a role and try again." },
        { status: 400 }
      )
    }

    let user = await UserService.getUserByEmail(email)
    if (!user) {
      const userData: Omit<User, "_id" | "createdAt" | "updatedAt"> = {
        email,
        fullName,
        userName,
        phone: "",
        cart: [],
        wishlist: [],
        orders: [],
        role: "customer",
        disabled: false,
        isEmailVerified: false,
        preferences: {
          newsletter: false,
          notifications: true,
        },
      }
      user = await UserService.createUser(userData)
      await usersCol.updateOne(
        { _id: user._id },
        { $set: { roles: [roleId], updatedAt: new Date() } }
      )
    } else {
      const updates: Record<string, unknown> = { roles: [roleId], updatedAt: new Date() }
      if (!user.userName || user.userName !== userName) {
        updates.userName = userName
      }
      if (!user.fullName || user.fullName !== fullName) {
        updates.fullName = fullName
      }
      await usersCol.updateOne({ _id: user._id }, { $set: updates })
    }

    const tokenTtlMinutes = Number(process.env.ADMIN_INVITE_TOKEN_TTL_MINUTES || 60 * 24)
    const userId = String(user._id)
    const { token, payload } = signAdminInviteJwt({
      userId,
      email,
      secret,
      expiresInSeconds: tokenTtlMinutes * 60,
    })
    const expiresAt = new Date(payload.exp * 1000)

    const alreadyPending = await invitesCol.findOne({
      email,
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
    if (alreadyPending) {
      return NextResponse.json({ error: "An active invite already exists for this email" }, { status: 409 })
    }

    const permissionDetails = (roleDoc.permissions || []).map((p) => ({
      key: p,
      meaning: permissionMeaning(p),
    }))

    const inviteInsert = await invitesCol.insertOne({
      userId: new ObjectId(userId),
      email,
      userName,
      fullName,
      roleId,
      roleName: roleDoc.name,
      permissionSnapshot: roleDoc.permissions || [],
      token,
      expiresAt,
      usedAt: null,
      revokedAt: null,
      createdAt: new Date(),
      createdByEmail: admin.adminEmail || undefined,
    })
    console.info("[admin.team.invite] Invite record created", {
      inviteId: String(inviteInsert.insertedId),
      email,
      roleId,
      roleName: roleDoc.name,
      createdByEmail: admin.adminEmail || undefined,
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const inviteLink = `${baseUrl}/auth/admin-invite?token=${encodeURIComponent(token)}`
    const inviteEmail = buildInviteEmail({
      displayName: fullName || userName,
      inviteLink,
      roleName: roleDoc.name,
      permissionDetails,
    })

    try {
      console.info("[admin.team.invite] Sending invite email", {
        inviteId: String(inviteInsert.insertedId),
        email,
        roleName: roleDoc.name,
      })
      await sendEmail({
        to: email,
        subject: `Temade Admin Invite - ${roleDoc.name}`,
        html: inviteEmail.html,
        text: inviteEmail.text,
      })
      console.info("[admin.team.invite] Invite email sent", {
        inviteId: String(inviteInsert.insertedId),
        email,
      })
    } catch (inviteEmailError) {
      console.error("[admin.team.invite] Invite email failed, revoking invite", {
        inviteId: String(inviteInsert.insertedId),
        email,
        error: inviteEmailError instanceof Error ? inviteEmailError.message : String(inviteEmailError),
      })
      await invitesCol.updateOne(
        { _id: inviteInsert.insertedId },
        { $set: { revokedAt: new Date() } }
      )
      return NextResponse.json(
        { error: "Invite was created but email delivery failed. Please retry invite/resend after checking email config." },
        { status: 502 }
      )
    }

    await writeAuditLog({
      actorEmail: admin.adminEmail,
      action: "admin_invite_created",
      targetEmail: email,
      targetId: userId,
      metadata: { roleId, roleName: roleDoc.name, permissions: roleDoc.permissions || [] },
    })

    return NextResponse.json({ success: true, inviteLink }, { status: 201 })
  } catch (error) {
    console.error("Admin team POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminFromRequest(request)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const body = await request.json()
    const inviteId = String(body.inviteId || "").trim()
    if (!inviteId || !ObjectId.isValid(inviteId)) {
      return NextResponse.json({ error: "Valid inviteId is required" }, { status: 400 })
    }

    const secret = process.env.EMAIL_VERIFICATION_JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Email verification secret is missing" }, { status: 500 })
    }

    const db = await getDatabase()
    const invitesCol = db.collection<InviteDoc>("admin_invites")
    const rolesCol = db.collection<Role>("roles")
    const invite = await invitesCol.findOne({
      _id: new ObjectId(inviteId),
      usedAt: null,
      revokedAt: null,
    })
    if (!invite) {
      return NextResponse.json({ error: "Active invite not found" }, { status: 404 })
    }

    const roleDoc = ObjectId.isValid(invite.roleId)
      ? await rolesCol.findOne({ _id: new ObjectId(invite.roleId) })
      : null
    const roleName = roleDoc?.name || invite.roleName || "assigned role"
    const permissionSnapshot = roleDoc?.permissions || invite.permissionSnapshot || []

    const tokenTtlMinutes = Number(process.env.ADMIN_INVITE_TOKEN_TTL_MINUTES || 60 * 24)
    const { token, payload } = signAdminInviteJwt({
      userId: String(invite.userId),
      email: invite.email,
      secret,
      expiresInSeconds: tokenTtlMinutes * 60,
    })
    const expiresAt = new Date(payload.exp * 1000)

    await invitesCol.updateOne(
      { _id: invite._id },
      {
        $set: {
          token,
          expiresAt,
          resentAt: new Date(),
          roleName,
          permissionSnapshot,
          createdByEmail: admin.adminEmail || invite.createdByEmail,
        },
      }
    )

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const inviteLink = `${baseUrl}/auth/admin-invite?token=${encodeURIComponent(token)}`
    const inviteEmail = buildInviteEmail({
      displayName: invite.fullName || invite.userName,
      inviteLink,
      roleName,
      permissionDetails: permissionSnapshot.map((p) => ({ key: p, meaning: permissionMeaning(p) })),
    })
    try {
      console.info("[admin.team.invite] Resending invite email", {
        inviteId,
        email: invite.email,
        roleName,
      })
      await sendEmail({
        to: invite.email,
        subject: `Temade Admin Invite (Resent) - ${roleName}`,
        html: inviteEmail.html,
        text: inviteEmail.text,
      })
      console.info("[admin.team.invite] Invite resend email sent", {
        inviteId,
        email: invite.email,
      })
    } catch (resendError) {
      console.error("[admin.team.invite] Invite resend failed", {
        inviteId,
        email: invite.email,
        error: resendError instanceof Error ? resendError.message : String(resendError),
      })
      return NextResponse.json({ error: "Failed to resend invite email" }, { status: 502 })
    }

    await writeAuditLog({
      actorEmail: admin.adminEmail,
      action: "admin_invite_resent",
      targetEmail: invite.email,
      targetId: String(invite.userId),
      metadata: { inviteId, roleId: invite.roleId, roleName },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin team PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdminFromRequest(request)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const body = await request.json()
    const inviteId = String(body.inviteId || "").trim()
    if (!inviteId || !ObjectId.isValid(inviteId)) {
      return NextResponse.json({ error: "Valid inviteId is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const invitesCol = db.collection<InviteDoc>("admin_invites")
    const invite = await invitesCol.findOne({
      _id: new ObjectId(inviteId),
      usedAt: null,
      revokedAt: null,
    })
    if (!invite) {
      return NextResponse.json({ error: "Active invite not found" }, { status: 404 })
    }

    await invitesCol.updateOne(
      { _id: invite._id },
      { $set: { revokedAt: new Date() } }
    )

    await writeAuditLog({
      actorEmail: admin.adminEmail,
      action: "admin_invite_revoked",
      targetEmail: invite.email,
      targetId: String(invite.userId),
      metadata: { inviteId, roleId: invite.roleId, roleName: invite.roleName },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin team DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
