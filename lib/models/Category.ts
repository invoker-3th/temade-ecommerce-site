import type { ObjectId } from "mongodb"

export interface Category {
  _id?: ObjectId
  name: string
  slug: string
  parentId?: ObjectId | null
  createdAt: Date
  updatedAt: Date
}



