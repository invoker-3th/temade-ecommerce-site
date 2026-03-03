type EmailTemplate = {
  subject: string
  html: string
  text: string
}

export function signupVerificationEmail(opts: { userName?: string; otp: string; verifyLink: string }): EmailTemplate {
  const name = opts.userName || "there"
  return {
    subject: "Verify your Temade account",
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Welcome to Temade Studios</h2>
        <p>Hi ${name},</p>
        <p>Thanks for joining Temade. Your one-time passcode (OTP) is:</p>
        <p style="font-size: 22px; font-weight: bold; letter-spacing: 2px;">${opts.otp}</p>
        <p>Click the button below to verify your email:</p>
        <p><a href="${opts.verifyLink}" style="background:#8D2741;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
        <p>If the button doesn't work, open this link:</p>
        <p>${opts.verifyLink}</p>
      </div>
    `,
    text: `Welcome to Temade. Your OTP is ${opts.otp}. Verify here: ${opts.verifyLink}`,
  }
}

export function loginWelcomeEmail(opts: { userName?: string; email: string; isAdmin?: boolean; timeISO: string }): EmailTemplate {
  const adminFlag = opts.isAdmin ? "Yes" : "No"
  const name = opts.userName || "there"
  return {
    subject: "Welcome back to Temade Studios",
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Welcome back, ${name}</h2>
        <p>Your login was successful.</p>
        <p>Email: <strong>${opts.email}</strong></p>
        <p>Admin access: <strong>${adminFlag}</strong></p>
        <p>Time: ${opts.timeISO}</p>
      </div>
    `,
    text: `Welcome back, ${name}. Login successful at ${opts.timeISO}. Admin access: ${adminFlag}.`,
  }
}

export function adminNewUserEmail(opts: { userName?: string; email: string; userId?: string; userLink?: string }): EmailTemplate {
  const name = opts.userName || "New user"
  const link = opts.userLink || ""
  return {
    subject: `New user joined: ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>New user joined</h2>
        <p><strong>${name}</strong> signed up with email: <strong>${opts.email || "-"}</strong></p>
        ${link ? `<p><a href="${link}" style="background:#8D2741;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open User</a></p><p>${link}</p>` : ""}
      </div>
    `,
    text: `New user ${name} (${opts.email || "-"}) joined. ${link}`,
  }
}

export function adminOtpLoginEmail(opts: { userName?: string; loginLink: string; expiresMinutes: number }): EmailTemplate {
  const name = opts.userName || "there"
  return {
    subject: "Your Temade admin login link",
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Admin login verification</h2>
        <p>Hi ${name},</p>
        <p>Use this one-time secure link to open your admin dashboard.</p>
        <p><a href="${opts.loginLink}" style="background:#8D2741;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Log in to Admin Dashboard</a></p>
        <p>This link expires in ${opts.expiresMinutes} minutes and can be used once.</p>
        <p>If the button does not work, open this link:</p>
        <p>${opts.loginLink}</p>
      </div>
    `,
    text: `Hi ${name}, use this one-time link to log in: ${opts.loginLink}. It expires in ${opts.expiresMinutes} minutes.`,
  }
}

export function adminOtpLoginAlertEmail(opts: {
  userName?: string
  email: string
  loginLink: string
  expiresMinutes: number
  timeISO: string
  ip?: string
  userAgent?: string
}): EmailTemplate {
  const name = opts.userName || "admin user"
  return {
    subject: "Admin OTP login verification requested",
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Admin OTP login requested</h2>
        <p>User: <strong>${name}</strong></p>
        <p>Email: <strong>${opts.email}</strong></p>
        <p>Time: ${opts.timeISO}</p>
        <p>IP: ${opts.ip || "unknown"}</p>
        <p>User-Agent: ${opts.userAgent || "unknown"}</p>
        <p>Verification link (expires in ${opts.expiresMinutes} minutes):</p>
        <p><a href="${opts.loginLink}" style="background:#8D2741;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open OTP Verification Link</a></p>
        <p>If the button does not work, open this link:</p>
        <p>${opts.loginLink}</p>
      </div>
    `,
    text: `Admin OTP login requested for ${name} (${opts.email}) at ${opts.timeISO}. IP: ${opts.ip || "unknown"}. UA: ${opts.userAgent || "unknown"}. Verification link (expires in ${opts.expiresMinutes} minutes): ${opts.loginLink}`,
  }
}
