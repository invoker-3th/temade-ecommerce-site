import test from "node:test"
import assert from "node:assert/strict"
import { isSessionActive, parseCookieFromHeader } from "@/lib/server/sessionAuth"

test("parseCookieFromHeader returns cookie value when present", () => {
  const cookie = "foo=bar; temade_admin_session=abc123; another=value"
  const value = parseCookieFromHeader(cookie, "temade_admin_session")
  assert.equal(value, "abc123")
})

test("parseCookieFromHeader returns empty string when cookie is missing", () => {
  const cookie = "foo=bar; another=value"
  const value = parseCookieFromHeader(cookie, "temade_admin_session")
  assert.equal(value, "")
})

test("isSessionActive returns true for valid active session", () => {
  const now = new Date("2026-03-02T12:00:00.000Z")
  const active = isSessionActive({
    expiresAt: new Date("2026-03-02T14:00:00.000Z"),
    revokedAt: null,
  }, now)
  assert.equal(active, true)
})

test("isSessionActive returns false for expired session", () => {
  const now = new Date("2026-03-02T12:00:00.000Z")
  const active = isSessionActive({
    expiresAt: new Date("2026-03-02T11:59:59.000Z"),
    revokedAt: null,
  }, now)
  assert.equal(active, false)
})

test("isSessionActive returns false for revoked session", () => {
  const now = new Date("2026-03-02T12:00:00.000Z")
  const active = isSessionActive({
    expiresAt: new Date("2026-03-02T14:00:00.000Z"),
    revokedAt: new Date("2026-03-02T11:00:00.000Z"),
  }, now)
  assert.equal(active, false)
})
