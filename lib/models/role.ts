import type { ObjectId } from "mongodb"

export interface Role {
  _id?: ObjectId
  name: string
  description?: string
  permissions: string[]
  emailSubscriptions: string[]
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export default Role
