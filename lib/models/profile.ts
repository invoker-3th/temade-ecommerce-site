import { ObjectId } from "mongodb"

export interface Profile {
  _id?: ObjectId
  userId: ObjectId
  fullName: string
  userName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  createdAt: Date
  updatedAt: Date
}
