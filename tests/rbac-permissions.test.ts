import test from "node:test"
import assert from "node:assert/strict"
import { hasPermission } from "@/lib/server/permissionGuard"
import { permissionMeaning } from "@/lib/server/permissionMeanings"

test("hasPermission allows exact permission matches", () => {
  assert.equal(hasPermission(["orders:view", "users:view"], "orders:view"), true)
})

test("hasPermission allows wildcard permissions", () => {
  assert.equal(hasPermission(["*"], "admin:audit:view"), true)
})

test("hasPermission denies missing permission", () => {
  assert.equal(hasPermission(["orders:view"], "orders:edit"), false)
})

test("permissionMeaning returns useful meaning for known permission", () => {
  const meaning = permissionMeaning("catalog:edit")
  assert.equal(typeof meaning, "string")
  assert.equal(meaning.length > 10, true)
})

test("permissionMeaning returns fallback text for unknown permission", () => {
  const meaning = permissionMeaning("custom:unknown:permission")
  assert.equal(meaning, "Permission is granted for this action.")
})

